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
    const mezcla = gsap.utils.interpolate(PALETAS[i], PALETAS[i + 1], k - i) as Record<string, string>;
    for (const clave in mezcla) muesca.style.setProperty(clave, mezcla[clave]);
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

  // Cada mensaje del chat vive en una fila que se abre; la burbuja entra con resorte.
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
    tl.to(fila, { height: "auto", marginTop: fila.dataset.margen, duration: 0.42, ease: "power2.out" }, en).to(
      fila.firstElementChild,
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
      en + 0.05,
    );
  }

  // El reloj y el cielo los pinta solo la escena en curso: la última cuyo inicio ya pasó.
  const pintores: Array<{ tl: Timeline; pintar: () => void }> = [];
  const enCurso = () => {
    const y = scrollY + 2;
    let actual = pintores[0];
    for (const p of pintores) if (p.tl.scrollTrigger && p.tl.scrollTrigger.start <= y) actual = p;
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
  const enTiempo = (tl: Timeline, t: number) => () => {
    const st = tl.scrollTrigger!;
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
      { autoAlpha: 0, y: 10 },
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
      .to(lineasH1, { yPercent: -60, autoAlpha: 0, filter: "blur(6px)", duration: 0.55, stagger: 0.08, ease: "power2.in" }, 0.5)
      .to($$(".portada-entrada, .acciones", portada), { y: -24, autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: "power2.in" }, 0.55)
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
      tl.to($("p", frases[i]), { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, en + 0.18);
    };
    const salirFrase = (i: number, en: number) => {
      tl.to(palabrasFrases[i], { yPercent: -115, duration: 0.3, stagger: 0.02, ease: "power2.in" }, en).to(
        $("p", frases[i]),
        { autoAlpha: 0, y: -8, duration: 0.25, ease: "power2.in" },
        en,
      );
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
    salirFrase(0, 4.1);
    entrarFrase(1, 4.3);
    voltear(180, 4.2);
    tl.fromTo(ocupados, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.08, immediateRender: false }, 5.0)
      .fromTo(pedida, { autoAlpha: 0, scale: 1.14 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, 5.3)
      .to(pedida, { keyframes: { x: [0, 6, -6, 4, -3, 0] }, duration: 0.42, ease: "none" }, 5.6)
      .fromTo(
        [libre1030, libre1100],
        { autoAlpha: 0, scale: 0.94 },
        { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.1, ease: "back.out(1.8)", immediateRender: false },
        5.8,
      );
    salirFrase(1, 6.1);
    entrarFrase(2, 6.3);
    voltear(360, 6.2);
    mostrarFila(tl, filas[3], 6.95);
    mostrarFila(tl, filas[4], 7.45);
    salirFrase(2, 7.9);
    entrarFrase(3, 8.1);
    voltear(540, 8.0);
    tl.to([pedida, libre1030, libre1100], { autoAlpha: 0, duration: 0.3 }, 8.72)
      .fromTo(cita, { autoAlpha: 0, y: -34, scale: 1.08 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.8)", immediateRender: false }, 8.8)
      .fromTo(globo, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "back.out(2)", immediateRender: false }, 9.2);
    salirFrase(3, 9.8);
    entrarFrase(4, 10.0);
    voltear(720, 9.9);
    mostrarFila(tl, filas[5], 10.65);
    tl.to({}, { duration: 1.0 }, 11.2);

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
    const panel = $(".dia-panel", diaEscena);
    const citaDia = $("[data-cita-dia]");
    const notaDia = $("[data-nota-dia]");
    centrar(rg);
    centrar(arco);

    // Reloj de rodillo: las unidades giran siempre; decenas y horas ruedan al acarreo.
    const suave = (x: number) => x * x * (3 - 2 * x);
    const escalon = (x: number) => {
      const base = Math.floor(x);
      const f = x - base;
      return base + (f < 0.7 ? 0 : suave((f - 0.7) / 0.3));
    };
    function rodillo(minutos: number) {
      const delDia = ((minutos % 1440) + 1440) % 1440;
      const h = Math.floor(delDia / 60);
      const min = delDia - h * 60;
      const unidades = min % 10;
      tiraM2.style.transform = `translateY(${-escalon(unidades)}em)`;
      const decenas = Math.floor(min / 10) + (unidades > 9 ? suave(unidades - 9) : 0);
      tiraM1.style.transform = `translateY(${-decenas}em)`;
      const horas = h + (min > 59 ? suave(min - 59) : 0);
      tiraH.style.transform = `translateY(${-horas}em)`;
      const dia = DIAS[Math.floor(minutos / 1440) % 7];
      if (rgDia.textContent !== dia) rgDia.textContent = dia;
    }

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
    gsap.set(diaEscena, { autoAlpha: 0 });
    gsap.set(ps, { yPercent: 115 });
    gsap.set($("p", frase), { autoAlpha: 0, y: 10 });
    gsap.set(notaDia, { autoAlpha: 0, y: 6 });

    const tl = fijar(escenaAmanece);
    tl.fromTo(rg, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out" }, 0)
      .fromTo(arco, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.05)
      .to(reloj, { m: 1980, duration: 2.1, ease: "power1.inOut" }, 0.3)
      // El reloj grande sube y se vuelve el de la muesca; la agenda de la mañana aparece.
      .to(rg, { autoAlpha: 0, scale: 0.42, y: () => -innerHeight * 0.36, duration: 0.5, ease: "power2.in" }, 2.45)
      .to(arco, { autoAlpha: 0, y: 40, duration: 0.45, ease: "power2.in" }, 2.45)
      .set(diaEscena, { autoAlpha: 1 }, 2.7);
    entrarPalabras(tl, ps, 2.72);
    tl.to($("p", frase), { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 2.95)
      .fromTo(
        panel,
        { clipPath: "inset(0% 0% 100% 0% round 20px)", y: 40 },
        { clipPath: "inset(0% 0% 0% 0% round 20px)", y: 0, duration: 0.7, ease: "power3.out", immediateRender: false },
        2.8,
      )
      .fromTo(citaDia, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: "back.out(2.4)", immediateRender: false }, 3.25)
      .to(notaDia, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 3.4)
      .to({}, { duration: 0.6 }, 3.8);

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
      { nombre: "08-madrugada", y: enTiempo(tl, 1.2) },
      { nombre: "09-amanece", y: enTiempo(tl, 2.2) },
      { nombre: "10-la-cita-ya-esta", y: enTiempo(tl, 4.2) },
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
    gsap.set($("p", frase), { autoAlpha: 0, y: 10 });
    gsap.set([pausa, ana], { autoAlpha: 0, y: 12 });

    const tl = fijar(escena);
    entrarPalabras(tl, ps, 0);
    tl.to($("p", frase), { autoAlpha: 1, y: 0, duration: 0.4 }, 0.25).fromTo(
      tel,
      { y: 36, autoAlpha: 0.2 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: "power2.out", immediateRender: false },
      0,
    );
    mostrarFila(tl, filas[0], 0.35);
    mostrarFila(tl, filas[1], 0.9);
    tl.to(pausa, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 1.3);
    mostrarFila(tl, filas[2], 2.0);
    if (!escritorio) tl.to(pausa, { autoAlpha: 0, y: -8, duration: 0.3 }, 2.15);
    tl.to(ana, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 2.3).to({}, { duration: 0.6 }, 2.8);
    tl.eventCallback(
      "onUpdate",
      registrarPintor(tl, () => {
        pintarReloj(tl.time() < 1.95 ? 2120 : 2126, horasEquipo);
        pintarCielo(3);
      }),
    );
    puntos.push({ nombre: "11-algo-delicado", y: enTiempo(tl, 1.8) }, { nombre: "12-tu-equipo", y: enTiempo(tl, 3.2) });
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
    const tl = fijar(escena);
    entrarPalabras(tl, ps, 0);
    tl.fromTo(controles, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, 0.2).to({}, { duration: 3.9 }, 0.1);
    const horas = [2190, 2405, 2560, 7805];
    const cortes = [1.05, 2.05, 3.05];
    let activa = 0;
    const pintar = registrarPintor(tl, () => {
      pintarReloj(horas[activa]);
      pintarCielo(3);
    });
    tl.eventCallback("onUpdate", () => {
      const t = tl.time();
      const i = cortes.filter((c) => t >= c).length;
      if (i !== activa) {
        activa = i;
        fijarEstado({ diaActiva: i });
      }
      pintar();
    });
    const centros = [0.55, 1.55, 2.55, 3.55];
    irADia = (i) => irA(enTiempo(tl, centros[i])());
    centros.forEach((c, i) => puntos.push({ nombre: `${13 + i}-dia-${i + 1}`, y: enTiempo(tl, c) }));
  });
  medir("dia");
  };

  // ═══ 5 · Tu parte: 15 minutos ══════════════════════════════════════════
  const construirInstala = () => {
  ctx.add(() => {
    const escena = $("[data-escena=instala]");
    const frase = $("[data-frase-instala]");
    const ps = palabras($("h2", frase));
    const trazos = $$("[data-ruta-trazo]", escena);
    const pasos = $$("[data-paso-instala]", escena);
    gsap.set(ps, { yPercent: 115 });
    gsap.set($("p", frase), { autoAlpha: 0, y: 10 });
    gsap.set(trazos, { drawSVG: "0%" });
    gsap.set(pasos, { autoAlpha: 0, y: 18 });
    const tl = fijar(escena);
    entrarPalabras(tl, ps, 0);
    tl.to($("p", frase), { autoAlpha: 1, y: 0, duration: 0.4 }, 0.2)
      .to(trazos, { drawSVG: "100%", duration: 1.6, ease: "none" }, 0.3)
      .to(pasos, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.62, ease: "power2.out" }, 0.35)
      .to({}, { duration: 0.5 }, 1.95);
    const reloj = { m: 7805 };
    tl.to(reloj, { m: 7820, duration: 1.6, ease: "none" }, 0.3);
    tl.eventCallback(
      "onUpdate",
      registrarPintor(tl, () => {
        pintarReloj(reloj.m);
        pintarCielo(3);
      }),
    );
    puntos.push({ nombre: "17-tu-parte", y: enTiempo(tl, 2.4) });
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
    gsap.set(resto, { autoAlpha: 0, y: 18 });
    gsap.set(tarjeta, { autoAlpha: 0, y: 44 });
    ScrollTrigger.create({
      trigger: "#precio",
      start: "top 70%",
      once: true,
      onEnter: () => {
        gsap.to(ps, { yPercent: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
        gsap.to(resto, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.2 });
        gsap.to(tarjeta, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.1 });
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
      },
    });
    const pregs = $("#preguntas");
    const titulo = palabras($("h2", pregs));
    const items = $$(".faq-item", pregs);
    gsap.set(titulo, { yPercent: 115 });
    gsap.set(items, { autoAlpha: 0, y: 16 });
    ScrollTrigger.create({
      trigger: pregs,
      start: "top 72%",
      once: true,
      onEnter: () => {
        gsap.to(titulo, { yPercent: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
        gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out", delay: 0.15 });
      },
    });
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
    gsap.set(resto, { autoAlpha: 0, y: 16 });
    const reloj = { m: 7820 };
    const tl = fijar(escena);
    tl.to(reloj, { m: 8627, duration: 1.3, ease: "power1.inOut" }, 0).to(tamborCierre, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0.7);
    entrarPalabras(tl, ps, 1.3, 0.55);
    tl.to(resto, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.1, ease: "power2.out" }, 1.55).to({}, { duration: 0.6 }, 2.0);
    tl.eventCallback(
      "onUpdate",
      registrarPintor(tl, () => {
        pintarReloj(reloj.m);
        pintarCielo(cieloPorHora(reloj.m % 1440));
      }),
    );
    puntos.push({ nombre: "20-esta-noche", y: enTiempo(tl, 2.4) });
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
    precio: () => $("#precio").getBoundingClientRect().top + scrollY,
    preguntas: () => $("#preguntas").getBoundingClientRect().top + scrollY,
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
  const alIrDia = (e: Event) => irADia?.((e as CustomEvent<number>).detail);
  window.addEventListener("yc:ir-dia", alIrDia);

  // Si cambia el ancho entre celular y escritorio, la historia se vuelve a armar desde cero.
  const alCambiarAncho = () => location.reload();
  ancho.addEventListener("change", alCambiarAncho);

  const pintarEnCurso = () => enCurso()?.pintar();
  ScrollTrigger.addEventListener("refresh", pintarEnCurso);

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
    construirTodo: () => construirHasta(Infinity),
  };

  return () => {
    ScrollTrigger.removeEventListener("refresh", pintarEnCurso);
    document.removeEventListener("click", alClic);
    window.removeEventListener("yc:ir-dia", alIrDia);
    ancho.removeEventListener("change", alCambiarAncho);
    if (latido) gsap.ticker.remove(latido);
    lenis?.destroy();
    ctx.revert();
    limpiezas.forEach((fn) => fn());
    window.__historiaLista = false;
  };
}
