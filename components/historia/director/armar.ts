import { fijarEstado } from "@/lib/historia-estado";
import { cuandoTambor } from "@/lib/tambor";
import { DIAS, PALETAS, cieloPorHora, clamp, esperarCuadro, horaDe, rectoRelativo } from "./utiles";

type Gsap = typeof import("gsap").gsap;
type Timeline = ReturnType<Gsap["timeline"]>;

/**
 * La historia con scroll. Cada escena es un timeline fijado (ScrollTrigger) y cada paso muestra
 * una capacidad real. Un solo reloj y un solo cielo los recorren a todos.
 * Se arma en trozos (un cuadro entre escena y escena) para no bloquear el hilo principal.
 */
const modulos = () =>
  Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText"), import("gsap/DrawSVGPlugin")]);

/** Descarga GSAP y sus plugins sin armar nada (se llama en un momento ocioso). */
export async function precargarHistoria() {
  await modulos();
}

export async function armarHistoria(): Promise<() => void> {
  const [{ gsap }, { ScrollTrigger }, { SplitText }, { DrawSVGPlugin }] = await modulos();
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
  await document.fonts.ready;

  const $ = (s: string, c: ParentNode = document) => c.querySelector(s) as HTMLElement;
  const $$ = (s: string, c: ParentNode = document) => Array.from(c.querySelectorAll(s)) as HTMLElement[];
  const ancho = matchMedia("(min-width: 900px)");
  const escritorio = ancho.matches;
  const suavizado = escritorio ? 0.55 : 0.35;
  const tambor = await cuandoTambor("portada");
  const limpiezas: Array<() => void> = [];
  const ctx = gsap.context(() => {});
  // Las curvas de tokens.css en GSAP: salida para lo que entra, cambio para lo que va de un
  // estado a otro y resorte solo para lo que llega como confirmación (una burbuja, un bloque de
  // la agenda, la cita). Antes había siete back.out distintos, también en notas y avisos.
  const CURVA = { salida: "power3.out", cambio: "power2.inOut", resorte: "back.out(1.7)" } as const;

  // ── Reloj de la muesca y de los teléfonos ─────────────────────────────
  const relojDia = $("[data-reloj-dia]");
  const relojHora = $("[data-reloj-hora]");
  const horasNoche = $$("#tel-noche [data-hora-tel]");
  const horasEquipo = $$("#tel-equipo [data-hora-tel]");
  let ultimoReloj = "";
  function pintarReloj(minutos: number, telefonos: HTMLElement[] = []) {
    const { dia, hora } = horaDe(minutos);
    if (dia + hora !== ultimoReloj) {
      ultimoReloj = dia + hora;
      relojDia.textContent = dia;
      relojHora.textContent = hora;
    }
    telefonos.forEach((t) => {
      if (t.textContent !== hora) t.textContent = hora;
    });
  }

  // ── El cielo: cuatro capas por opacidad y la muesca con la misma hora ────
  const capas = [$("[data-cielo=madrugada]"), $("[data-cielo=alba]"), $("[data-cielo=dia]")];
  const muesca = $("[data-muesca]");
  const escenaAmanece = $("[data-escena=amanece]");
  let ultimaF = -1;
  function pintarCielo(f: number) {
    const k = Math.round(clamp(f, 0, 3) * 300) / 300;
    if (k === ultimaF) return;
    ultimaF = k;
    capas.forEach((capa, i) => {
      capa.style.opacity = clamp(k - i).toFixed(3);
    });
    const i = Math.min(2, Math.floor(k));
    const t = k - i;
    // El fondo de la muesca se funde con el cielo; la tinta cambia de golpe a la mitad. Si también
    // se fundía, entre la madrugada y el alba texto y fondo pasaban juntos por el mismo gris
    // (contraste ~1.1:1). Así, antes de la mitad va tinta clara sobre fondo que aún es oscuro y
    // después tinta oscura sobre fondo que ya es claro: nunca baja de ~3.8:1.
    const fondo = gsap.utils.interpolate(PALETAS[i], PALETAS[i + 1], t) as Record<string, string>;
    const tinta = t < 0.5 ? PALETAS[i] : PALETAS[i + 1];
    for (const clave in fondo) muesca.style.setProperty(clave, clave === "--muesca-fondo" ? fondo[clave] : tinta[clave as keyof (typeof PALETAS)[number]]);
    escenaAmanece.style.setProperty("--dia", clamp((k - 1.2) / 1.8).toFixed(3));
  }
  pintarCielo(0);

  // ── Utilidades de escena ──────────────────────────────────────────────
  /**
   * El timeline de una escena, atado al recorrido de su sección. La escena ya está pegada con
   * sticky (CSS): aquí no hay `pin`, así que ScrollTrigger no mueve nodos ni recalcula alturas.
   */
  function fijar(escena: HTMLElement): Timeline {
    return gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: escena.parentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: suavizado,
        invalidateOnRefresh: true,
      },
    });
  }

  /**
   * La entrada de una escena: su propio tramo de scroll mientras la sección sube a la pantalla,
   * de que asoma abajo a que se pega arriba. Sin esto, la escena subía en su estado inicial —su
   * timeline arranca ya fija— y durante casi una pantalla solo se veía el fondo. El timeline dura
   * 1: cada posición es la fracción de esa subida. Lo que un elemento hace aquí y en el timeline
   * fijo va con fromTo en los dos, para que el orden en que se pintan no importe.
   */
  function entrada(escena: HTMLElement): Timeline {
    return gsap
      .timeline({
        defaults: { ease: CURVA.salida },
        scrollTrigger: {
          trigger: escena.parentElement,
          start: "top 90%",
          end: "top top",
          scrub: suavizado,
          invalidateOnRefresh: true,
        },
      })
      .to({}, { duration: 1 }, 0);
  }

  // Marcas de tiempo del armado, para medirlo (performance.getEntriesByType("measure")).
  let marca = performance.now();
  const medir = (nombre: string) => {
    performance.measure(`historia:${nombre}`, { start: marca, end: performance.now() });
    marca = performance.now();
  };

  /**
   * GSAP absorbe la propiedad `translate` de CSS al animar y la vuelve x/y: el centrado en
   * porcentaje se perdería al animar `y`. Aquí se pasa a xPercent/yPercent, que GSAP guarda aparte.
   */
  function centrar(el: HTMLElement) {
    const t = getComputedStyle(el).translate;
    const [a = "0px", b = "0px"] = t && t !== "none" ? t.split(" ") : [];
    gsap.set(el, {
      translate: "none",
      xPercent: a.endsWith("%") ? parseFloat(a) : 0,
      yPercent: b.endsWith("%") ? parseFloat(b) : 0,
      x: a.endsWith("px") ? parseFloat(a) : 0,
      y: b.endsWith("px") ? parseFloat(b) : 0,
    });
  }

  /** Mide con ciertas propiedades de GSAP en su valor final y luego las regresa como estaban. */
  function conNeutro<T>(pares: Array<[HTMLElement, Record<string, number>]>, medir: () => T): T {
    const guardado = pares.map(
      ([el, props]) => [el, Object.fromEntries(Object.keys(props).map((k) => [k, gsap.getProperty(el, k)]))] as const,
    );
    pares.forEach(([el, props]) => gsap.set(el, props));
    const resultado = medir();
    guardado.forEach(([el, props]) => gsap.set(el, props));
    return resultado;
  }

  /** Palabras que suben desde una máscara (Stagger Text con SplitText). */
  function palabras(el: HTMLElement) {
    const partido = SplitText.create(el, { type: "words", mask: "words", wordsClass: "palabra" });
    limpiezas.push(() => partido.revert());
    return partido.words as HTMLElement[];
  }

  function entrarPalabras(tl: Timeline, ps: HTMLElement[], en: number, duracion = 0.45) {
    tl.fromTo(ps, { yPercent: 115 }, { yPercent: 0, duration: duracion, stagger: 0.035, ease: "power3.out", immediateRender: false }, en);
  }

  // Cada mensaje del chat vive en una fila que se abre; la burbuja entra con resorte cuando su
  // fila ya casi tiene su alto. Así, donde se detenga el scroll, se ve un hueco que crece o una
  // burbuja entera que aparece, nunca una burbuja cortada por su propia fila.
  function prepararFilas(filas: HTMLElement[]) {
    const margenes = filas.map((fila) => getComputedStyle(fila).marginTop);
    filas.forEach((fila, i) => {
      const b = fila.firstElementChild as HTMLElement;
      fila.dataset.margen = margenes[i];
      gsap.set(fila, { height: 0, marginTop: 0, overflow: "hidden" });
      gsap.set(b, { autoAlpha: 0, y: 14, scale: 0.94, transformOrigin: fila.classList.contains("pac") ? "100% 100%" : "0% 100%" });
    });
  }

  function mostrarFila(tl: Timeline, fila: HTMLElement, en: number) {
    tl.to(fila, { height: "auto", marginTop: fila.dataset.margen, duration: 0.26, ease: "power2.out" }, en).to(
      fila.firstElementChild,
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.36, ease: CURVA.resorte },
      en + 0.18,
    );
  }

  // El reloj y el cielo los pinta solo la escena en curso: la última cuyo inicio ya pasó.
  const pintores: Array<{ tl: Timeline; pintar: () => void }> = [];
  const enCurso = () => {
    const y = scrollY + 2;
    let actual = pintores[0];
    // El disparador de un timeline nace con inicio y fin en 0 y GSAP lo mide hasta el siguiente
    // tick (ScrollTrigger.js, init): sin esta guarda, la escena recién armada se adueñaba del
    // reloj y del cielo aunque el visitante estuviera muy arriba de ella.
    for (const p of pintores) {
      const st = p.tl.scrollTrigger;
      if (st && st.end > st.start && st.start <= y) actual = p;
    }
    return actual;
  };
  function registrarPintor(tl: Timeline, pintar: () => void) {
    const pintor = { tl, pintar };
    pintores.push(pintor);
    return () => {
      if (enCurso() === pintor) pintar();
    };
  }

  const puntos: Array<{ nombre: string; y: () => number }> = [];
  // Para el teclado: cómo revelar en el acto (precio, preguntas) o a qué punto llevar el scroll
  // (escenas con scroll) cuando el foco cae en algo que la historia todavía no enseña.
  const reveladores: Record<string, () => void> = {};
  // La portada (titular, botón, cilindro) se desvanece al avanzar: su punto es el principio.
  const puntosFoco: Record<string, () => number> = { noche: () => 0 };
  const enTiempo = (tl: Timeline, t: number) => () => {
    const st = tl.scrollTrigger!;
    // Recién creado, GSAP todavía no lo mide (ver enCurso): se mide aquí mismo, o un salto a esta
    // escena daría NaN y el navegador lo tomaría como «ir al principio».
    if (!(st.end > st.start)) st.refresh();
    return st.start + (t / tl.duration()) * (st.end - st.start);
  };

  // ═══ 1 · 23:47 La noche ════════════════════════════════════════════════
  const escenaNoche = $("[data-escena=noche]");
  // Paso 1: el teléfono se maqueta y toma su estado inicial (primero lecturas, luego escrituras).
  const preNoche = ctx.add(() => {
    const portada = $("[data-portada]");
    const lineasH1 = $$(".h1-linea", portada);
    const frases = $$("[data-frases] .frase");
    const vuelo = $("[data-vuelo]");
    const tel = $("#tel-noche");
    const giro = $("[data-giro]", tel);
    const chat = $("[data-chat]", tel);
    const filas = ["n1", "n2", "n3", "n4", "n5", "n6"].map((n) => $(`[data-b="${n}"]`, tel));
    const b1 = filas[0].firstElementChild as HTMLElement;
    const apagada = $("[data-apagada]", tel);
    const destello = $("[data-destello]", tel);
    const halo = $("[data-halo]", escenaNoche);
    const ficticia = $("[data-ficticia]", escenaNoche);
    const ocupados = $$('#tel-noche [data-ag="ocupado"]');
    const pedida = $('#tel-noche [data-ag="pedida"]');
    const libre1030 = $('#tel-noche [data-ag="libre-1030"]');
    const libre1100 = $('#tel-noche [data-ag="libre-1100"]');
    const cita = $('#tel-noche [data-ag="cita"]');
    const globo = $('#tel-noche [data-ag="globo"]');

    tel.style.contentVisibility = "visible";
    centrar(tel);
    centrar(halo);
    prepararFilas(filas.slice(1));
    gsap.set(b1, { autoAlpha: 0 });
    gsap.set(tel, { autoAlpha: 0, y: () => innerHeight * 0.5, rotationX: 22, transformPerspective: 1400, transformOrigin: "50% 100%" });
    gsap.set(apagada, { opacity: 1 });
    gsap.set([...ocupados, pedida, libre1030, libre1100, cita, globo], { autoAlpha: 0 });
    return { portada, lineasH1, frases, vuelo, tel, giro, chat, filas, b1, apagada, destello, halo, ficticia, ocupados, pedida, libre1030, libre1100, cita, globo };
  });
  medir("noche-telefono");
  await esperarCuadro();
  marca = performance.now();

  // Paso 2: las frases de los pasos se parten en palabras (SplitText).
  const palabrasFrases = ctx.add(() => {
    const partidas = preNoche.frases.map((f) => palabras($("h2", f)));
    preNoche.frases.forEach((f) => gsap.set(f, { opacity: 1 }));
    partidas.forEach((ps) => gsap.set(ps, { yPercent: 115 }));
    gsap.set(
      preNoche.frases.map((f) => $("p", f)),
      { opacity: 0, y: 10 },
    );
    return partidas;
  });
  medir("noche-frases");
  await esperarCuadro();
  marca = performance.now();

  // Paso 3: el timeline de la noche.
  const tlNoche = ctx.add(() => {
    const { portada, lineasH1, frases, vuelo, tel, giro, chat, filas, b1, apagada, destello, halo, ficticia, ocupados, pedida, libre1030, libre1100, cita, globo } =
      preNoche;

    // Geometría del vuelo: de la carta del frente a la primera burbuja (se recalcula al redimensionar).
    type Caja = { x: number; y: number; w: number; h: number };
    let geo: { a: Caja; b: Caja } | null = null;
    const olvidar = () => (geo = null);
    ScrollTrigger.addEventListener("refreshInit", olvidar);
    limpiezas.push(() => ScrollTrigger.removeEventListener("refreshInit", olvidar));
    const G = () => {
      if (geo) return geo;
      const e = escenaNoche.getBoundingClientRect();
      const cs = getComputedStyle(escenaNoche);
      const cx = (parseFloat(cs.getPropertyValue("--cx")) / 100) * e.width;
      const cy = (parseFloat(cs.getPropertyValue("--cy")) / 100) * e.height;
      const carta = tambor.carta(0);
      const w = carta?.offsetWidth ?? 250;
      const h = carta?.offsetHeight ?? 96;
      const c = conNeutro(
        [
          [tel, { y: 0, rotationX: 0, scale: 1 }],
          [giro, { rotationY: 0 }],
        ],
        () => rectoRelativo(chat, escenaNoche),
      );
      const bw = b1.offsetWidth;
      const bh = b1.offsetHeight;
      geo = { a: { x: cx - w / 2, y: cy - h / 2, w, h }, b: { x: c.x + c.w - 12 - bw, y: c.y + c.h - 6 - bh, w: bw, h: bh } };
      return geo;
    };

    const guia = { f: 0 };
    const atenuacion = { otras: 1, frente: 1 };
    const tl = fijar(escenaNoche);
    tl.addLabel("inicio", 0)
      // La portada se retira; el cilindro se alinea en el mensaje de las 23:47.
      // opacity y no autoAlpha: el H1 sale de la vista pero no del árbol de accesibilidad.
      // Sube poco y se apaga antes de llegar a la muesca (con -60 % y power2.in, en celular pasaba
      // todavía legible por debajo de la barra).
      .to(lineasH1, { yPercent: -32, filter: "blur(6px)", duration: 0.55, stagger: 0.08, ease: "power2.in" }, 0.5)
      .to(lineasH1, { opacity: 0, duration: 0.42, stagger: 0.08, ease: "power1.in" }, 0.5)
      .to($$(".portada-entrada, .acciones", portada), { y: -24, opacity: 0, duration: 0.45, stagger: 0.05, ease: "power2.in" }, 0.55)
      .to(guia, { f: 1, duration: 0.8, ease: "power2.inOut", onUpdate: () => tambor.guiar(guia.f, 0) }, 0.5)
      .to(atenuacion, { otras: 0, duration: 0.45, ease: "power1.in", onUpdate: () => tambor.atenuar(atenuacion.otras, atenuacion.frente) }, 1.15)
      // El mensaje se desprende y cae al WhatsApp: de notificación a burbuja.
      // La notificación vuela entera en arco, se achica al ancho de la burbuja y se disuelve en ella.
      .set(vuelo, { autoAlpha: 1, width: () => G().a.w, height: () => G().a.h }, 1.55)
      .to(atenuacion, { frente: 0, duration: 0.01, onUpdate: () => tambor.atenuar(atenuacion.otras, atenuacion.frente) }, 1.56)
      .fromTo(vuelo, { x: () => G().a.x }, { x: () => G().b.x, duration: 0.9, ease: "power1.inOut", immediateRender: false }, 1.55)
      .fromTo(vuelo, { y: () => G().a.y }, { y: () => G().b.y, duration: 0.9, ease: "power3.in", immediateRender: false }, 1.55)
      .fromTo(
        vuelo,
        { scale: 1, rotation: -3 },
        { scale: () => G().b.w / G().a.w, rotation: 0, duration: 0.9, ease: "power2.inOut", immediateRender: false },
        1.55,
      )
      .to(vuelo, { autoAlpha: 0, duration: 0.28, ease: "power1.in" }, 2.2)
      .fromTo(b1, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, 2.24)
      // El teléfono sube y su pantalla se enciende cuando llega el mensaje.
      .to(tel, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.95, ease: "power3.out" }, 1.5)
      .to(halo, { opacity: 1, scale: 1.06, duration: 0.8, ease: "power2.out" }, 1.9)
      .to(apagada, { opacity: 0, duration: 0.28, ease: "power1.out" }, 2.3)
      .fromTo(destello, { opacity: 0 }, { opacity: 0.55, duration: 0.1, immediateRender: false }, 2.34)
      .to(destello, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.44)
      .to(ficticia, { opacity: 1, duration: 0.4 }, 2.55);

    const entrarFrase = (i: number, en: number) => {
      entrarPalabras(tl, palabrasFrases[i], en);
      tl.to($("p", frases[i]), { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, en + 0.18);
    };
    // Una frase a la vez: la que sale se desvanece entera y sube un poco (antes sus palabras
    // salían por la máscara mientras las nuevas ya subían por la misma franja, y por ~230 px de
    // scroll se leían pedazos de dos frases); la siguiente empieza a subir cuando ya se fue.
    const cambiarFrase = (de: number, a: number, en: number) => {
      tl.fromTo($("h2", frases[de]), { opacity: 1, y: 0 }, { opacity: 0, y: -14, duration: 0.2, ease: "power1.in", immediateRender: false }, en).to(
        $("p", frases[de]),
        { opacity: 0, y: -8, duration: 0.18, ease: "power1.in" },
        en,
      );
      entrarFrase(a, en + 0.24);
    };
    const voltear = (grados: number, en: number) => {
      tl.to(giro, { rotationY: grados, duration: 0.72, ease: "power2.inOut" }, en).to(
        tel,
        { keyframes: [{ scale: 1.035, duration: 0.36, ease: "power1.out" }, { scale: 1, duration: 0.36, ease: "power1.in" }] },
        en,
      );
    };

    entrarFrase(0, 2.65);
    mostrarFila(tl, filas[1], 2.95);
    mostrarFila(tl, filas[2], 3.6);
    cambiarFrase(0, 1, 4.1);
    voltear(180, 4.2);
    tl.fromTo(ocupados, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.08, immediateRender: false }, 5.0)
      .fromTo(pedida, { autoAlpha: 0, scale: 1.14 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: CURVA.resorte, immediateRender: false }, 5.3)
      .to(pedida, { keyframes: { x: [0, 6, -6, 4, -3, 0] }, duration: 0.42, ease: "none" }, 5.6)
      .fromTo(
        [libre1030, libre1100],
        { autoAlpha: 0, scale: 0.94 },
        { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.1, ease: CURVA.resorte, immediateRender: false },
        5.8,
      );
    cambiarFrase(1, 2, 6.1);
    voltear(360, 6.2);
    mostrarFila(tl, filas[3], 6.95);
    mostrarFila(tl, filas[4], 7.45);
    cambiarFrase(2, 3, 7.9);
    voltear(540, 8.0);
    tl.to([pedida, libre1030, libre1100], { autoAlpha: 0, duration: 0.3 }, 8.72)
      .fromTo(cita, { autoAlpha: 0, y: -34, scale: 1.08 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: CURVA.resorte, immediateRender: false }, 8.8)
      .fromTo(globo, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: CURVA.resorte, immediateRender: false }, 9.2);
    cambiarFrase(3, 4, 9.8);
    voltear(720, 9.9);
    mostrarFila(tl, filas[5], 10.65);
    // Un respiro para leer «Listo» con la confirmación completa, y de ahí sube el amanecer. Antes
    // era un segundo entero: más de 3/4 de pantalla en que nada cambiaba.
    tl.to({}, { duration: 0.6 }, 11.2);

    // El día que mira la agenda, la hora y la portada en pausa, según el punto de la historia.
    let diaAgenda = 2;
    fijarEstado({ diaAgenda: 2 });
    const pintar = registrarPintor(tl, () => {
      const t = tl.time();
      pintarReloj(t < 3.6 ? 1427 : t < 8.8 ? 1428 : 1429, horasNoche);
      pintarCielo(0);
    });
    let cara = "frente";
    tl.eventCallback("onUpdate", () => {
      const giroY = Number(gsap.getProperty(giro, "rotationY")) || 0;
      const grados = ((giroY % 360) + 360) % 360;
      const ahora = grados > 90 && grados < 270 ? "reverso" : "frente";
      if (ahora !== cara) {
        cara = ahora;
        giro.dataset.cara = ahora;
      }
      const t = tl.time();
      const d = t >= 4.9 ? 3 : 2;
      if (d !== diaAgenda) {
        diaAgenda = d;
        fijarEstado({ diaAgenda: d });
      }
      portada.toggleAttribute("data-quieto", t > 1.2);
      pintar();
    });

    puntos.push(
      { nombre: "01-portada", y: () => 0 },
      { nombre: "02-vuelo", y: enTiempo(tl, 2.05) },
      { nombre: "03-contesta", y: enTiempo(tl, 3.95) },
      { nombre: "04-revisa-agenda", y: enTiempo(tl, 5.95) },
      { nombre: "05-ofrece-otra", y: enTiempo(tl, 7.8) },
      { nombre: "06-deja-la-cita", y: enTiempo(tl, 9.6) },
      { nombre: "07-listo", y: enTiempo(tl, 11.4) },
    );
    return tl;
  });
  medir("noche");
  await esperarCuadro();

  // ═══ 2 · La noche pasa y amanece (23:49 → jue 09:00) ═══════════════════
  const construirAmanece = () => {
  ctx.add(() => {
    const rg = $("[data-reloj-grande]");
    const rgDia = $("[data-rg-dia]");
    const tiraH = $('[data-rg="h"]');
    const tiraM1 = $('[data-rg="m1"]');
    const tiraM2 = $('[data-rg="m2"]');
    const arco = $("[data-arco]");
    const recorrido = $("[data-arco-recorrido]") as unknown as SVGPathElement;
    const sol = $("[data-sol]");
    const diaEscena = $("[data-dia-escena]");
    const frase = $(".frase", diaEscena);
    const hoja = $(".dia-agenda", diaEscena);
    const citaDia = $("[data-cita-dia]");
    const notaDia = $("[data-nota-dia]");
    centrar(rg);
    centrar(arco);

    // Reloj de rodillo, como un odómetro: las unidades ruedan en el último 30 % de cada minuto y
    // las decenas y las horas ruedan solo mientras rueda el dígito de abajo (antes las decenas
    // rodaban todo el último minuto de la decena y el reloj se quedaba en «04:U9»). Y cuando el
    // scroll se detiene, cada tira termina de rodar hasta su dígito entero.
    const suave = (x: number) => x * x * (3 - 2 * x);
    const escalon = (x: number) => {
      const base = Math.floor(x);
      const f = x - base;
      return base + (f < 0.7 ? 0 : suave((f - 0.7) / 0.3));
    };
    const tiras = { h: 0, m1: 0, m2: 0 };
    const aplicarTiras = () => {
      tiraH.style.transform = `translateY(${-tiras.h}em)`;
      tiraM1.style.transform = `translateY(${-tiras.m1}em)`;
      tiraM2.style.transform = `translateY(${-tiras.m2}em)`;
    };
    let asiento: ReturnType<typeof setTimeout> | undefined;
    const asentarTiras = () =>
      gsap.to(tiras, {
        h: Math.round(tiras.h),
        m1: Math.round(tiras.m1),
        m2: Math.round(tiras.m2),
        duration: 0.22,
        ease: CURVA.salida,
        onUpdate: aplicarTiras,
      });
    function rodillo(minutos: number) {
      const delDia = ((minutos % 1440) + 1440) % 1440;
      const h = Math.floor(delDia / 60);
      const min = delDia - h * 60;
      const unidades = escalon(min % 10);
      const acarreo = Math.max(0, unidades - 9);
      gsap.killTweensOf(tiras);
      tiras.m2 = unidades;
      tiras.m1 = Math.floor(min / 10) + acarreo;
      tiras.h = h + (min >= 59 ? acarreo : 0);
      aplicarTiras();
      clearTimeout(asiento);
      asiento = setTimeout(asentarTiras, 140);
      const dia = DIAS[Math.floor(minutos / 1440) % 7];
      if (rgDia.textContent !== dia) rgDia.textContent = dia;
    }
    limpiezas.push(() => clearTimeout(asiento));

    // El sol va por ángulo (como las marcas de hora) y el trazo por longitud: una tabla los empata.
    // La longitud del arco (elipse de 540 × 320) se integra en números: sin preguntarle al DOM.
    const tabla = [{ s: 0, u: 0 }];
    for (let i = 1, s = 0; i <= 60; i++) {
      const t0 = (Math.PI * (i - 1)) / 60;
      const t1 = (Math.PI * i) / 60;
      s += Math.hypot(540 * (Math.cos(t0) - Math.cos(t1)), 320 * (Math.sin(t1) - Math.sin(t0)));
      tabla.push({ s, u: i / 60 });
    }
    const largo = tabla[tabla.length - 1].s;
    const largoEn = (u: number) => {
      if (u <= 0) return 0;
      const i = tabla.findIndex((f) => f.u >= u);
      if (i < 0) return largo;
      if (i === 0) return 0;
      const a = tabla[i - 1];
      const b = tabla[i];
      return a.s + ((u - a.u) / (b.u - a.u || 1)) * (b.s - a.s);
    };
    function sol_(minutos: number) {
      const h = (((minutos % 1440) + 1440) % 1440) / 60;
      const u = (h - 6.833) / 11.833;
      const v = clamp(u);
      const x = 600 - 540 * Math.cos(Math.PI * v);
      const y = 380 - 320 * Math.sin(Math.PI * v) + (u < 0 ? Math.min(60, -u * 400) : 0);
      gsap.set(sol, { x, y, opacity: u < -0.02 ? 0 : 1 });
      gsap.set(recorrido, { drawSVG: `0 ${largoEn(v).toFixed(1)}` });
    }
    const ps = palabras($("h2", frase));
    const reloj = { m: 1429 };
    rodillo(1429);
    sol_(1429);
    gsap.set(diaEscena, { opacity: 0 });
    gsap.set(ps, { yPercent: 115 });
    gsap.set($("p", frase), { opacity: 0, y: 10 });
    gsap.set(notaDia, { opacity: 0, y: 6 });

    // Entra con su subida: el reloj grande (23:49, la misma hora de la muesca) y el arco ya vienen
    // mientras se va la noche. Antes subía vacía y el reloj aparecía hasta que se fijaba.
    entrada(escenaAmanece)
      .fromTo(rg, { autoAlpha: 0, scale: 0.92, y: 48 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6 }, 0.25)
      .fromTo(arco, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4);

    const tl = fijar(escenaAmanece);
    // La noche pasa volando y la madrugada despacio: el cielo aclara a lo largo de más de media
    // pantalla de scroll. Antes, con un solo tween power1.inOut, la hora corría más rápido justo
    // en la madrugada y el cielo pasaba de noche a alba en ~70 px, como un destello.
    tl.fromTo(reloj, { m: 1429 }, { m: 1710, duration: 0.8, ease: "power1.in" }, 0)
      .to(reloj, { m: 1980, duration: 1.8, ease: "none" }, 0.8)
      // A las 09:00 el reloj grande sube y se vuelve el de la muesca; la agenda llega cuando ya se
      // fue (antes subía encima de él mientras todavía se leía).
      .fromTo(rg, { autoAlpha: 1, scale: 1, y: 0 }, { autoAlpha: 0, scale: 0.42, y: () => -innerHeight * 0.36, duration: 0.45, ease: "power2.in", immediateRender: false }, 2.62)
      .fromTo(arco, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 40, duration: 0.4, ease: "power2.in", immediateRender: false }, 2.62)
      .set(diaEscena, { opacity: 1 }, 3.0);
    entrarPalabras(tl, ps, 3.02);
    // La agenda y la cita toman su estado inicial desde que se arma la escena (render inmediato):
    // con immediateRender: false, entre 3.0 (la escena se enciende) y 3.1 (empieza el dibujo) la
    // agenda se veía completa, luego saltaba a recortada y se volvía a dibujar (lo vio Diego en la
    // PC; scripts/agenda-0900.mjs lo reproduce).
    tl.to($("p", frase), { opacity: 1, y: 0, duration: 0.4, ease: CURVA.salida }, 3.25)
      .fromTo(
        hoja,
        { clipPath: "inset(0% 0% 100% 0% round 20px)", y: 40 },
        { clipPath: "inset(0% 0% 0% 0% round 20px)", y: 0, duration: 0.7, ease: CURVA.salida },
        3.1,
      )
      .fromTo(citaDia, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: CURVA.resorte }, 3.55)
      .to(notaDia, { opacity: 1, y: 0, duration: 0.35, ease: CURVA.salida }, 3.7)
      .to({}, { duration: 0.6 }, 4.1);

    const pintar = registrarPintor(tl, () => {
      pintarReloj(reloj.m);
      pintarCielo(cieloPorHora(reloj.m % 1440));
    });
    tl.eventCallback("onUpdate", () => {
      rodillo(reloj.m);
      sol_(reloj.m);
      pintar();
    });
    puntos.push(
      { nombre: "08-madrugada", y: enTiempo(tl, 1.3) },
      { nombre: "09-amanece", y: enTiempo(tl, 2.45) },
      { nombre: "10-la-cita-ya-esta", y: enTiempo(tl, 4.5) },
    );
  });
  medir("amanece");
  };

  // ═══ 3 · 11:20 Tu equipo ═══════════════════════════════════════════════
  const construirEquipo = () => {
  ctx.add(() => {
    const escena = $("[data-escena=equipo]");
    const frase = $("[data-frase-equipo]");
    const tel = $("#tel-equipo");
    const filas = ["e1", "e2", "e3"].map((n) => $(`[data-b="${n}"]`, tel));
    const pausa = $('[data-nota="pausa"]');
    const ana = $('[data-nota="ana"]');
    centrar(tel);
    prepararFilas(filas);
    const ps = palabras($("h2", frase));
    gsap.set(ps, { yPercent: 115 });
    gsap.set($("p", frase), { opacity: 0, y: 10 });
    gsap.set([pausa, ana], { opacity: 0, y: 12 });

    // Entra con su subida: el título, el párrafo y el teléfono. Antes el teléfono subía entero y,
    // al fijarse la escena, caía de golpe a 0.2 y volvía (su fromTo no se aplicaba hasta arrancar).
    const ent = entrada(escena);
    entrarPalabras(ent, ps, 0.2, 0.5);
    ent.fromTo($("p", frase), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.55).fromTo(
      tel,
      { y: 60, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8 },
      0.1,
    );

    const tl = fijar(escena);
    mostrarFila(tl, filas[0], 0.15);
    mostrarFila(tl, filas[1], 0.7);
    tl.to(pausa, { opacity: 1, y: 0, duration: 0.4, ease: CURVA.salida }, 1.1);
    mostrarFila(tl, filas[2], 1.8);
    if (!escritorio) tl.to(pausa, { opacity: 0, y: -8, duration: 0.3 }, 1.95);
    tl.to(ana, { opacity: 1, y: 0, duration: 0.4, ease: CURVA.salida }, 2.1).to({}, { duration: 0.6 }, 2.6);
    tl.eventCallback(
      "onUpdate",
      registrarPintor(tl, () => {
        pintarReloj(tl.time() < 1.75 ? 2120 : 2126, horasEquipo);
        pintarCielo(3);
      }),
    );
    puntos.push({ nombre: "11-algo-delicado", y: enTiempo(tl, 1.6) }, { nombre: "12-tu-equipo", y: enTiempo(tl, 3.0) });
  });
  medir("equipo");
  };

  // ═══ 4 · El resto del día (Diagonal Carousel) ══════════════════════════
  let irADia: ((i: number) => void) | null = null;
  const construirDia = () => {
  ctx.add(() => {
    const escena = $("[data-escena=dia]");
    const frase = $("[data-frase-dia]");
    const controles = $(".diagonal-controles", escena);
    centrar(controles);
    const ps = palabras($("h2", frase));
    gsap.set(ps, { yPercent: 115 });
    // Entra con su subida: el título y los controles llegan con la primera tarjeta. Antes el
    // título entraba hasta que la escena se fijaba y los controles, visibles al subir, se apagaban
    // de golpe al fijarse (su fromTo no se aplicaba hasta arrancar).
    const ent = entrada(escena);
    entrarPalabras(ent, ps, 0.25, 0.5);
    ent.fromTo(controles, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.55);
    const tl = fijar(escena);
    tl.to({}, { duration: 4.0 }, 0);
    const horas = [2190, 2405, 2560, 7805];
    const cortes = [1.05, 2.05, 3.05];
    let activa = 0;
    const pintar = registrarPintor(tl, () => {
      pintarReloj(horas[activa]);
      pintarCielo(3);
    });
    // Mientras se recorre una tarjeta, su punto se llena como barra: la escena está fija y la
    // tarjeta quieta ~0.8 pantallas, y sin esto el scroll no daba señal de avanzar.
    const limites = [0, ...cortes, tl.duration()];
    let ultimoAvance = "";
    tl.eventCallback("onUpdate", () => {
      const t = tl.time();
      const i = cortes.filter((c) => t >= c).length;
      if (i !== activa) {
        activa = i;
        fijarEstado({ diaActiva: i });
      }
      const avance = clamp((t - limites[i]) / (limites[i + 1] - limites[i])).toFixed(3);
      if (avance !== ultimoAvance) {
        ultimoAvance = avance;
        controles.style.setProperty("--avance", avance);
      }
      pintar();
    });
    const centros = [0.55, 1.55, 2.55, 3.55];
    irADia = (i) => irA(enTiempo(tl, centros[i])());
    centros.forEach((c, i) => puntos.push({ nombre: `${13 + i}-dia-${i + 1}`, y: enTiempo(tl, c) }));
    puntosFoco.dia = enTiempo(tl, centros[0]);
  });
  medir("dia");
  };

  // ═══ 5 · En 7 días contesta ═══════════════════════════════════════════
  const construirInstala = () => {
  ctx.add(() => {
    const escena = $("[data-escena=instala]");
    const frase = $("[data-frase-instala]");
    const ps = palabras($("h2", frase));
    const trazos = $$("[data-ruta-trazo]", escena);
    const pasos = $$("[data-paso-instala]", escena);
    gsap.set(ps, { yPercent: 115 });
    gsap.set($("p", frase), { opacity: 0, y: 10 });
    gsap.set(trazos, { drawSVG: "0%" });
    gsap.set(pasos, { opacity: 0, y: 18 });
    // Entra con su subida: el título, el párrafo, el principio de la ruta y el día 1. Antes se
    // fijaba vacía (porcelana y una raya) y todo empezaba ahí.
    const ent = entrada(escena);
    entrarPalabras(ent, ps, 0.15, 0.5);
    ent.fromTo($("p", frase), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.45)
      .fromTo(trazos, { drawSVG: "0% 0%" }, { drawSVG: "0% 16%", duration: 0.4, ease: "none" }, 0.6)
      .fromTo(pasos[0], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35 }, 0.62);
    const tl = fijar(escena);
    // Ya fija, la ruta sigue dibujándose con el scroll y cada día aparece cuando la ruta lo alcanza.
    tl.fromTo(trazos, { drawSVG: "0% 16%" }, { drawSVG: "0% 100%", duration: 1.4, ease: "none", immediateRender: false }, 0)
      .fromTo(pasos.slice(1), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.62, ease: CURVA.salida, immediateRender: false }, 0.35)
      .to({}, { duration: 0.5 }, 1.4);
    const reloj = { m: 7805 };
    tl.to(reloj, { m: 7820, duration: 1.4, ease: "none" }, 0);
    tl.eventCallback(
      "onUpdate",
      registrarPintor(tl, () => {
        pintarReloj(reloj.m);
        pintarCielo(3);
      }),
    );
    puntos.push({ nombre: "17-tu-parte", y: enTiempo(tl, 1.75) });
  });
  medir("instala");
  };

  // ═══ 6 · Precio y preguntas: se leen y se juegan (sin fijar) ═══════════
  const construirPrecio = () => {
  ctx.add(() => {
    const frase = $("[data-precio-frase]");
    const ps = palabras($("h2", frase));
    const resto = $$(":scope > :not(h2)", frase);
    const tarjeta = $("[data-precio-tarjeta]");
    const borde = $(".brillo-borde", tarjeta);
    gsap.set(ps, { yPercent: 115 });
    gsap.set(resto, { opacity: 0, y: 18 });
    gsap.set(tarjeta, { opacity: 0, y: 44 });
    // La revelación la dispara el scroll o, antes, el foco del teclado (ver alEnfocar).
    let precioVisto = false;
    let disparoPrecio: { kill: () => void } | null = null;
    const revelarPrecio = () => {
      if (precioVisto) return;
      precioVisto = true;
      disparoPrecio?.kill();
      gsap.to(ps, { yPercent: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
      gsap.to(resto, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.2 });
      gsap.to(tarjeta, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.1 });
      // La luz recorre la tarjeta una vez, como invitación a mover el control.
      borde.style.transition = "none";
      gsap.fromTo(
        borde,
        { "--glow-angle": "-220deg" },
        {
          "--glow-angle": "140deg",
          duration: 1.8,
          ease: "power2.out",
          delay: 0.3,
          onComplete: () => void (borde.style.transition = ""),
        },
      );
    };
    // En cuanto asoma (antes, al 70 %: la parte de abajo de la pantalla subía vacía un buen tramo).
    disparoPrecio = ScrollTrigger.create({ trigger: "#precio", start: "top 88%", once: true, onEnter: revelarPrecio });
    reveladores.precio = revelarPrecio;
    const pregs = $("#preguntas");
    const titulo = palabras($("h2", pregs));
    const items = $$(".faq-item", pregs);
    gsap.set(titulo, { yPercent: 115 });
    gsap.set(items, { opacity: 0, y: 16 });
    let preguntasVistas = false;
    let disparoPreguntas: { kill: () => void } | null = null;
    const revelarPreguntas = () => {
      if (preguntasVistas) return;
      preguntasVistas = true;
      disparoPreguntas?.kill();
      gsap.to(titulo, { yPercent: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
      gsap.to(items, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out", delay: 0.15 });
    };
    disparoPreguntas = ScrollTrigger.create({ trigger: pregs, start: "top 88%", once: true, onEnter: revelarPreguntas });
    reveladores.preguntas = revelarPreguntas;
    // Si el foco ya estaba adentro cuando se armó (Tab más rápido que el scroll), se revela ya.
    if ($("#precio").contains(document.activeElement)) revelarPrecio();
    if (pregs.contains(document.activeElement)) revelarPreguntas();
    puntos.push({ nombre: "18-precio", y: () => $("#precio").getBoundingClientRect().top + scrollY - 40 });
    puntos.push({ nombre: "19-preguntas", y: () => pregs.getBoundingClientRect().top + scrollY - 40 });
  });
  medir("precio");
  };

  // ═══ 7 · Vuelve a ser de noche ═════════════════════════════════════════
  const construirCierre = () => {
  ctx.add(() => {
    const escena = $("[data-escena=cierre]");
    const tamborCierre = $(".tambor-cierre", escena);
    const frase = $("[data-cierre-frase]");
    const ps = palabras($("h2", frase));
    const resto = $$(":scope > :not(h2)", frase);
    gsap.set(tamborCierre, { autoAlpha: 0 });
    gsap.set(ps, { yPercent: 115 });
    gsap.set(resto, { opacity: 0, y: 16 });
    const reloj = { m: 7820 };
    const pintarAtardecer = () => {
      pintarReloj(reloj.m);
      pintarCielo(cieloPorHora(reloj.m % 1440));
    };
    // Atardece mientras la escena sube. La escena es transparente: el cielo que oscurece se ve
    // por la ventana que abre al subir, y la noche llega de abajo hacia arriba. Antes subía vacía
    // sobre el porcelana, se fijaba vacía casi media pantalla y ahí el cielo pasaba a noche de golpe.
    // La tarde pasa rápido (10:20 → 17:30) y el atardecer despacio (17:30 → 20:30).
    const ent = entrada(escena);
    ent.fromTo(reloj, { m: 7820 }, { m: 8250, duration: 0.3, ease: "none" }, 0)
      .to(reloj, { m: 8430, duration: 0.7, ease: "none" }, 0.3)
      .fromTo(tamborCierre, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.45);
    ent.eventCallback("onUpdate", registrarPintor(ent, pintarAtardecer));
    const tl = fijar(escena);
    tl.fromTo(reloj, { m: 8430 }, { m: 8627, duration: 0.8, ease: CURVA.salida }, 0);
    entrarPalabras(tl, ps, 0.15, 0.55);
    tl.to(resto, { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: CURVA.salida }, 0.4).to({}, { duration: 0.8 }, 0.95);
    // Los mensajes de la noche giran con el scroll, no solos. El giro se escribe en el transform
    // con el ángulo ya resuelto, como en la portada, y en --giro para la opacidad de cada carta.
    const giro = $(".tambor-giro-solo", escena);
    const vuelta = { a: 0 };
    const girar = () => {
      const a = vuelta.a.toFixed(3);
      giro.style.transform = `rotateX(-7deg) translateZ(calc(var(--radio) * -1)) rotateY(${a}deg)`;
      giro.style.setProperty("--giro", `${a}deg`);
    };
    tl.fromTo(vuelta, { a: 0 }, { a: -72, ease: "none", duration: tl.duration(), onUpdate: girar, immediateRender: false }, 0);
    tl.eventCallback("onUpdate", registrarPintor(tl, pintarAtardecer));
    puntos.push({ nombre: "20-esta-noche", y: enTiempo(tl, 1.5) });
    puntosFoco.cierre = enTiempo(tl, 1.5);
    puntos.push({ nombre: "21-pie", y: () => document.documentElement.scrollHeight - innerHeight });
  });
  medir("cierre");
  };

  // ── Scroll suave en escritorio (Lenis), anclas y cierre ──────────────
  let lenis: import("lenis").default | null = null;
  let latido: ((t: number) => void) | null = null;
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const { default: Lenis } = await import("lenis");
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    latido = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(latido);
    gsap.ticker.lagSmoothing(0);
  }

  function irA(y: number) {
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  const destinos: Record<string, () => number> = {
    noche: () => 0,
    "paso-1": enTiempo(tlNoche, 2.95),
    // Menos la muesca (64 px y aire), para que el título no quede debajo de ella.
    precio: () => $("#precio").getBoundingClientRect().top + scrollY - 20,
    preguntas: () => $("#preguntas").getBoundingClientRect().top + scrollY - 84,
  };
  const alClic = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href")!.slice(1);
    const destino = destinos[id];
    if (!destino) return;
    e.preventDefault();
    irA(destino());
    const seccion = document.getElementById(id);
    if (seccion && (id === "precio" || id === "preguntas")) seccion.focus({ preventScroll: true });
  };
  document.addEventListener("click", alClic);

  // Con teclado, el foco puede caer en algo que la historia todavía no revela (opacidad baja):
  // se revela en el acto o se lleva el scroll a donde ya se ve. Primero se arma lo que falte.
  const casiInvisible = (el: Element) => {
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
      if (Number(getComputedStyle(n).opacity) < 0.5) return true;
    }
    return false;
  };
  // Y si quedó fuera de la pantalla (con Lenis en escritorio, el navegador no desplaza solo hacia
  // lo enfocado), se lleva ahí: un tercio abajo del borde, lejos de la muesca.
  const asegurarVista = (el: Element) => {
    const caja = el.getBoundingClientRect();
    // Una región que llena la escena (el carrusel del día, pegada arriba) no se «acomoda».
    if (caja.height > innerHeight / 2) return;
    if (caja.top < 72 || caja.bottom > innerHeight) irA(caja.top + scrollY - innerHeight / 3);
  };
  const alEnfocar = (e: FocusEvent) => {
    const el = e.target as Element | null;
    // La muesca y el enlace de salto van fijos arriba: siempre están a la vista.
    if (!el || el.closest?.("header, .saltar")) return;
    const seccion = el.closest?.("section.cap");
    if (!seccion) return asegurarVista(el);
    void construirHasta(seccion.getBoundingClientRect().top + scrollY + 1).then(() => {
      if (!casiInvisible(el)) return asegurarVista(el);
      const revelar = reveladores[seccion.id];
      if (revelar) return revelar();
      const punto = puntosFoco[seccion.id];
      if (punto) irA(punto());
    });
  };
  document.addEventListener("focusin", alEnfocar);
  const alIrDia = (e: Event) => irADia?.((e as CustomEvent<number>).detail);
  window.addEventListener("yc:ir-dia", alIrDia);

  // Si cambia el ancho entre celular y escritorio, la historia se vuelve a armar desde cero.
  const alCambiarAncho = () => {
    const mitad = innerHeight / 2;
    const actual = [...document.querySelectorAll("main > section")].filter((s) => s.getBoundingClientRect().top <= mitad).pop();
    try {
      if (actual?.id) sessionStorage.setItem("yc:volver", actual.id);
    } catch {
      // Sin sessionStorage (modo privado estricto): se recarga arriba.
    }
    location.reload();
  };
  ancho.addEventListener("change", alCambiarAncho);
  // Igual si la pantalla queda de menos de 500 px de alto (girar el celular): el arranque decide.
  const bajo = matchMedia("(max-height: 499px)");
  bajo.addEventListener("change", alCambiarAncho);

  const pintarEnCurso = () => enCurso()?.pintar();
  ScrollTrigger.addEventListener("refresh", pintarEnCurso);
  // Entre dos escenas no corre ningún timeline: sin esto, un salto dejaba el cielo y el reloj de
  // la escena anterior (pintarReloj y pintarCielo no repiten trabajo si nada cambia).
  window.addEventListener("scroll", pintarEnCurso, { passive: true });
  limpiezas.push(() => window.removeEventListener("scroll", pintarEnCurso));

  // Las demás escenas se arman al acercarse (a 2.5 pantallas), siempre en orden: así el trabajo
  // se reparte a lo largo del scroll y ninguna tarea larga coincide con una animación. Si el
  // visitante salta (un ancla), se arman todas las que quedaron arriba antes de pintar.
  const pendientes: Array<{ seccion: HTMLElement; construir: () => void }> = [
    { seccion: $("#amanece"), construir: construirAmanece },
    { seccion: $("#equipo"), construir: construirEquipo },
    { seccion: $("#dia"), construir: construirDia },
    { seccion: $("#instala"), construir: construirInstala },
    { seccion: $("#precio"), construir: construirPrecio },
    { seccion: $("#cierre"), construir: construirCierre },
  ];
  // Un solo ciclo de armado a la vez, que persigue el límite más lejano que se haya pedido. Solo
  // arranca si hay algo que armar, así que siempre espera al menos un cuadro: nunca termina en la
  // misma llamada ni deja en `construyendo` una promesa ya resuelta (encadenarse a una así, en cada
  // scroll, fue un bucle infinito de microtareas que congelaba la página).
  let objetivo = 0;
  let construyendo: Promise<void> | null = null;
  const faltaArmar = () =>
    pendientes.length > 0 && pendientes[0].seccion.getBoundingClientRect().top + scrollY < objetivo;
  function construirHasta(limite: number): Promise<void> {
    objetivo = Math.max(objetivo, limite);
    if (construyendo) return construyendo;
    if (!faltaArmar()) return Promise.resolve();
    construyendo = (async () => {
      try {
        do {
          const { construir } = pendientes.shift()!;
          await esperarCuadro();
          marca = performance.now();
          construir();
        } while (faltaArmar());
      } finally {
        construyendo = null;
      }
      pintarEnCurso();
      if (!pendientes.length) window.removeEventListener("scroll", alDesplazar);
    })();
    return construyendo;
  }
  const alDesplazar = () => void construirHasta(scrollY + innerHeight * 2.5);
  window.addEventListener("scroll", alDesplazar, { passive: true });
  limpiezas.push(() => window.removeEventListener("scroll", alDesplazar));
  alDesplazar();

  pintarEnCurso();
  window.__historiaLista = true;
  window.dispatchEvent(new Event("yc:historia"));
  (window as unknown as { __historia: unknown }).__historia = {
    puntos: () => puntos.map((p) => ({ nombre: p.nombre, y: Math.round(p.y()) })),
    // Resuelve cuando GSAP ya midió los disparadores nuevos (su medición va a 0.01 s en el mismo
    // reloj de GSAP), para que puntos() ya no dé posiciones en 0.
    construirTodo: () => construirHasta(Infinity).then(() => new Promise<void>((listo) => void gsap.delayedCall(0.05, listo))),
  };

  return () => {
    ScrollTrigger.removeEventListener("refresh", pintarEnCurso);
    document.removeEventListener("click", alClic);
    document.removeEventListener("focusin", alEnfocar);
    window.removeEventListener("yc:ir-dia", alIrDia);
    ancho.removeEventListener("change", alCambiarAncho);
    bajo.removeEventListener("change", alCambiarAncho);
    if (latido) gsap.ticker.remove(latido);
    lenis?.destroy();
    ctx.revert();
    limpiezas.forEach((fn) => fn());
    window.__historiaLista = false;
  };
}
