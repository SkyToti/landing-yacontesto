import { gsap } from "gsap";
import { type Cara } from "../moli/partes";
import { crearMoli, type Titere } from "../moli/titere";
import { T3 } from "../pausas";
import { CLINICA, CONSULTORIO, elige, origenActual, origenPara, yPara } from "./encuadres";
import type { Opciones } from "./manana";

/**
 * El acto de las 16:05: la transición T3 (corte a la toma abierta de la clínica entera, donde el reloj
 * gira de 11:20 a 16:05, y la cámara se acerca al doctor, que atiende en el sillón) y la
 * escena 4 (P13 a P15): Jorge pide mover su cita del viernes al sábado; Moli la busca con la lupa
 * (`buscar_mis_citas`), revisa el sábado (`ver_horarios_ocupados`), la carga con sus pinzas al hueco
 * de las 10:00 (`reagendar_cita`) y se la confirma. Lo arma el director de `noche/director.ts`, igual
 * que la mañana y el mediodía. Las capacidades, con su fuente, están junto a los textos
 * (`ROTULOS_TARDE` en textos.ts).
 *
 * Dueños: la cámara mueve `.plano-dia`, `.lamina-dia`, `.dib-consultorio`, `.mediodia-cerca`,
 * `.tarde-cerca`, `.rotulos` (la capa) y las manecillas; las actuaciones mueven a Moli, la tira, la
 * lupa, las pinzas, la cita y el chat.
 */

/** Cuántos mensajes del chat se ven en cada pausa: la petición y lo libre, la elección, la confirmación. */
const BURBUJAS: Record<number, number> = { 13: 2, 14: 3, 15: 4 };
/** En el celular la tira tapa el chat: en reposo solo está arriba en P14, con la cita recién movida. */
const TIRA_CELULAR: Record<number, boolean> = { 13: false, 14: true, 15: false };
const CARAS: Record<number, Cara> = { 13: "guino", 14: "feliz", 15: "feliz" };
const LIMA = "#ABFF84";

export function armarTarde(raiz: HTMLElement, { escenario, escritorio }: Opciones) {
  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;

  const capaRotulos = q(".rotulos");
  const planoDia = q(".plano-dia");
  const laminaDia = q(".lamina-dia");
  const dibConsultorio = q(".dib-consultorio");
  const hora = q(".manecilla-hora");
  const minuto = q(".manecilla-minuto");
  const cercaMediodia = q(".mediodia-cerca");
  const cerca = q(".tarde-cerca");
  const chat = q(".tel-tarde .chat");
  const chatCaja = q(".tel-tarde .tel-chat");
  const burbujas = Array.from(cerca.querySelectorAll<HTMLElement>(".burbuja"));
  const tira = q(".tira");
  const cols = q(".tira-cols");
  const jorge = q(".blq-jorge");
  const pinta = q(".blq-jorge .pinta");
  const libres = Array.from(cols.querySelectorAll<HTMLElement>('[data-col="1"] .fila-libre .fila-caja'));
  const destino = libres[0];
  const lupa = q(".lupa-tarde");
  const vidrio = q(".lupa-tarde .lupa-vidrio");
  const copia = q(".lupa-tarde .lupa-copia");
  const lente = q<SVGCircleElement>(".lupa-tarde .lente");
  const pinzas = q(".pinzas-tarde");
  const puntaPinzas = q<SVGCircleElement>(".pinzas-tarde .punta");
  const moli = crearMoli(q('[data-moli="mt"]'), "mt-c", "normal");

  // La tira aumentada dentro de la lupa es una copia: las animaciones tocan las dos. Mientras la capa
  // de las 16:05 está en display: none, la copia no le cuesta nada al arranque.
  copia.replaceChildren(cols.cloneNode(true));
  const colsCopia = copia.firstElementChild as HTMLElement;
  const libresCopia = Array.from(colsCopia.querySelectorAll<HTMLElement>('[data-col="1"] .fila-libre .fila-caja'));
  const jorgeCopia = colsCopia.querySelector<HTMLElement>(".blq-jorge")!;

  /* ── Medidas en el sistema del primer plano (la cámara lo escala de 0.92 a 1) ── */
  const escalaCerca = () => Number(gsap.getProperty(cerca, "scale")) || 1;
  function enPantalla(el: Element) {
    const e = escenario.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - e.left, y: r.top - e.top, w: r.width, h: r.height, cx: r.left - e.left + r.width / 2, cy: r.top - e.top + r.height / 2 };
  }
  function aLocal(px: number, py: number) {
    const s = escalaCerca();
    const ox = escenario.clientWidth / 2;
    const oy = escenario.clientHeight / 2;
    return { x: ox + (px - ox) / s, y: oy + (py - oy) / s };
  }
  /** La matriz de la tira (GSAP la mueve y está girada −1°), sin la traslación. */
  function giroTira() {
    const estilo = getComputedStyle(tira).transform;
    return new DOMMatrix(estilo === "none" ? undefined : estilo);
  }

  /** El centro del vidrio dentro de la lupa y la punta de las pinzas: se miden con las manos quietas. */
  let manos: { lente: { x: number; y: number }; pinzas: { x: number; y: number } } | null = null;
  function mideManos() {
    const s = escalaCerca();
    gsap.set([lupa, pinzas], { x: 0, y: 0, scale: 1, rotation: 0 });
    const m = enPantalla(lupa);
    const l = enPantalla(lente);
    const centro = { x: (l.cx - m.x) / s, y: (l.cy - m.y) / s };
    gsap.set(vidrio, { left: centro.x - l.w / s / 2, top: centro.y - l.h / s / 2, width: l.w / s, height: l.h / s });
    const mp = enPantalla(pinzas);
    const p = enPantalla(puntaPinzas);
    manos = { lente: centro, pinzas: { x: (p.cx - mp.x) / s, y: (p.cy - mp.y) / s } };
    return manos;
  }
  /** Dónde poner la lupa para que el centro de la lente quede sobre un lugar de la tira. */
  function lupaSobre(objetivo: Element) {
    const { lente: c } = manos ?? mideManos();
    const r = enPantalla(objetivo);
    const p = aLocal(r.cx, r.cy);
    return { x: p.x - c.x, y: p.y - c.y };
  }
  /** Dónde poner las pinzas para que pellizquen la orilla derecha de la cita. */
  function pinzasEnLaCita(dx = 0) {
    const { pinzas: c } = manos ?? mideManos();
    const r = enPantalla(jorge);
    const p = aLocal(r.x + r.w - 3 + dx, r.cy);
    return { x: p.x - c.x, y: p.y - c.y };
  }
  /** Lo que se ve dentro del vidrio: el punto de la tira bajo el centro de la lente, aumentado. */
  const aumento = () => (escritorio.matches ? 1.3 : 1.4);
  function actualizaVidrio() {
    const l = lente.getBoundingClientRect();
    const h = tira.getBoundingClientRect();
    const m = giroTira();
    const inv = m.inverse();
    const dx = l.left + l.width / 2 - (h.left + h.width / 2);
    const dy = l.top + l.height / 2 - (h.top + h.height / 2);
    const ux = inv.a * dx + inv.c * dy;
    const uy = inv.b * dx + inv.d * dy;
    const gx = tira.offsetWidth / 2 + ux - tira.clientLeft - cols.offsetLeft;
    const gy = tira.offsetHeight / 2 + uy - tira.clientTop - cols.offsetTop;
    const giro = (Math.atan2(m.b, m.a) * 180) / Math.PI - Number(gsap.getProperty(lupa, "rotation"));
    const d = vidrio.offsetWidth / 2;
    colsCopia.style.width = `${cols.offsetWidth}px`;
    colsCopia.style.height = `${cols.offsetHeight}px`;
    colsCopia.style.transform = `translate(${d}px, ${d}px) rotate(${giro}deg) scale(${aumento()}) translate(${-gx}px, ${-gy}px)`;
  }
  /**
   * Cuánto hay que mover la cita (en el sistema de la tira, que está girada) para dejarla sobre el
   * hueco de las 10:00 del sábado. Es el mismo lugar que le da el CSS con la clase `movida`.
   */
  function haciaElSabado() {
    const a = jorge.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    const inv = giroTira().inverse();
    const s = escalaCerca();
    const dx = (b.left + b.width / 2 - (a.left + a.width / 2)) / s;
    const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) / s;
    return { x: inv.a * dx + inv.c * dy, y: inv.b * dx + inv.d * dy };
  }
  /** Como en WhatsApp: el último mensaje queda abajo y empuja a los anteriores hacia arriba. */
  function desplazamiento(n: number) {
    const ultima = burbujas[n - 1];
    const estilo = getComputedStyle(chatCaja);
    const disponible = chatCaja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    return disponible - (ultima.offsetTop + ultima.offsetHeight);
  }
  // Sin tocar el centrado del CSS: en escritorio la tira entra de lado y en el celular sube desde abajo.
  const tiraFuera = () => (escritorio.matches ? { x: 48, yPercent: 0, autoAlpha: 0 } : { x: 0, yPercent: 118, autoAlpha: 0 });
  const tiraDentro = () => ({ x: 0, yPercent: 0, autoAlpha: 1 });
  const tiraArriba = (k: number) => (escritorio.matches ? k >= 13 : TIRA_CELULAR[k]);

  /* ── La cámara: T3, atada al scroll ── */
  // Como en la T2: GSAP guarda el centrado de la lámina a veces como xPercent y a veces como x en px, así
  // que la cámara la mueve con x relativa (+=), calculada con la geometría real (encuadres.ts).
  // Los dos encuadres, la toma abierta y el del doctor, se calculan juntos con UNA medición en el corte:
  // medir otra vez a media cámara caía en el mismo cuadro en que se prende una capa nueva y salía una
  // tarea larga.
  let alDoctor = 0;
  function mideEncuadres() {
    const s0 = Number(gsap.getProperty(laminaDia, "scaleX")) || 1;
    const abierta = origenPara(laminaDia, escenario, elige(CLINICA, escritorio.matches));
    alDoctor = origenPara(laminaDia, escenario, elige(CONSULTORIO, escritorio.matches)) - abierta;
    return `+=${abierta - origenActual(laminaDia, s0)}`;
  }
  function camara(tl: gsap.core.Timeline) {
    const t = T3.inicio;
    tl
      // El título se va antes del corte: con el corte encima, quedaba sobre el dibujo (Diego lo vio sobre la
      // cara de Moli, 9-oct).
      .to(capaRotulos, { opacity: 0, duration: 0.035 }, t - 0.045)
      // El consultorio se prende todavía tapado por el primer plano de las 11:20: su primer cálculo de
      // diseño no cae en el cuadro del corte, que mide. La lámina deja de recortar lo que sale de su caja:
      // el consultorio vive a su derecha.
      .set(dibConsultorio, { display: "block" }, t - 0.03)
      .set(laminaDia, { overflow: "visible" }, t - 0.03)
      // Corte del primer plano de las 11:20 a la toma abierta de la clínica entera, en el mismo instante y sin
      // fundido (dos capas a media opacidad se ven encimadas; scripts/r1-recorrido.mjs, 7-oct). Ya no pasa
      // por el plano general empujado hacia el celular, donde lo dejó la T2: ese Moli gigante parecía error.
      .set(planoDia, { opacity: 1 }, t)
      .set(cercaMediodia, { autoAlpha: 0 }, t)
      .set(
        laminaDia,
        { scale: () => elige(CLINICA, escritorio.matches).escala, x: mideEncuadres, y: () => yPara(escenario, elige(CLINICA, escritorio.matches)) },
        t,
      )
      // Con la clínica a cuadro, el reloj gira de 11:20 a 16:05: el minutero da cuatro vueltas y tres cuartos.
      .fromTo(hora, { rotation: 700 }, { rotation: 842.5, ease: "power1.inOut", duration: 0.22, immediateRender: false }, t + 0.02)
      .fromTo(minuto, { rotation: 1920 }, { rotation: 3630, ease: "power1.inOut", duration: 0.22, immediateRender: false }, t + 0.02)
      // El primer plano de las 16:05 se prende con la cámara en marcha, lejos del corte (que mide) y de la
      // pausa (9.2), y en dos tiempos: primero el celular y Moli, luego la tira y las manos. Prendido entero
      // de un jalón, su primer cálculo de diseño daba una tarea larga de 51 ms con la CPU 4× (r1-scroll).
      .set(cerca, { display: "block" }, t + 0.16)
      .set(tira, { display: "flex" }, t + 0.3)
      .set([lupa, pinzas], { display: "block" }, t + 0.3)
      // Las manos se miden en ese mismo cuadro (el diseño ya se está calculando) y no al llegar a P13.
      .call(() => void (manos ?? mideManos()), undefined, t + 0.3)
      // Y se acerca despacio al doctor, que atiende en el sillón con las manos ocupadas.
      .to(
        laminaDia,
        {
          scale: () => elige(CONSULTORIO, escritorio.matches).escala,
          x: () => `+=${alDoctor}`,
          y: () => yPara(escenario, elige(CONSULTORIO, escritorio.matches)),
          ease: "power1.inOut",
          duration: 0.3,
        },
        T3.empuja,
      )
      // Corte al primer plano: el celular de la clínica, que ya está sonando. El plano general se apaga en
      // el mismo instante; el primer plano termina de crecer y sus orillas son el papel del escenario.
      .set(planoDia, { opacity: 0 }, T3.llega)
      .set(cerca, { autoAlpha: 1 }, T3.llega)
      .fromTo(cerca, { scale: 0.92 }, { scale: 1, ease: "power2.out", duration: 0.12, immediateRender: false }, T3.llega)
      .to(capaRotulos, { opacity: 1, duration: 0.1 }, T3.llega + 0.06);
  }

  /* ── Reposo: lo que se ve quieto en cada pausa ── */
  /**
   * Antes de las 16:05 el reposo es el del CSS (`.cine` en tarde.css): el chat vacío, la tira guardada,
   * la cita en el viernes sin pintar y el sábado sin revisar. Al arrancar no se toca nada.
   */
  let ultimo = 12;
  function estado(pausa: number) {
    // Desde las 19:00 esta capa ya se fue: se queda como en P15, sin medir nada (el chat mide).
    const k = Math.min(Math.max(pausa, 12), 15);
    if (k === ultimo) return;
    ultimo = k;
    const n = BURBUJAS[k] ?? 0;
    burbujas.forEach((b, i) => gsap.set(b, { autoAlpha: i < n ? 1 : 0, scale: 1, y: 0 }));
    // El chat se mide solo cuando se ve (medirlo obliga a calcular el diseño de la página).
    if (n) gsap.set(chat, { y: desplazamiento(n) });
    gsap.set(tira, k >= 13 && tiraArriba(k) ? tiraDentro() : tiraFuera());
    // Desde P13 el sábado ya está revisado (lo libre en lima); desde P14 la cita está en el sábado y pintada.
    cols.classList.toggle("revisada", k >= 13);
    jorge.classList.toggle("movida", k >= 14);
    gsap.set(libres, { clearProps: "backgroundColor" });
    gsap.set(jorge, { clearProps: "transform,zIndex" });
    gsap.set(pinta, { clearProps: "transform" });
    gsap.set([lupa, pinzas], { autoAlpha: 0 });
    pinzas.classList.remove("cerradas");
    moli.quieto(CARAS[k] ?? "normal");
  }

  /** Llega un mensaje al chat, con su rebote, y el chat se recorre para dejarlo abajo. */
  function llega(tl: gsap.core.Timeline, i: number, t: number) {
    const b = burbujas[i];
    const paciente = b.classList.contains("de-paciente");
    tl.fromTo(
      b,
      { autoAlpha: 0, scale: 0.55, y: 10, transformOrigin: paciente ? "0% 100%" : "100% 100%" },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2)" },
      t,
    );
    tl.to(chat, { y: () => desplazamiento(i + 1), duration: 0.45, ease: "power3.out" }, t);
  }
  function subeTira(tl: gsap.core.Timeline, t: number) {
    tl.fromTo(tira, tiraFuera(), { ...tiraDentro(), duration: 0.55, ease: "power3.out" }, t);
  }
  function bajaTira(tl: gsap.core.Timeline, t: number) {
    tl.to(tira, { ...tiraFuera(), duration: 0.42, ease: "power2.in" }, t);
  }
  /** La lupa se desliza a otro lugar de la tira; el vidrio se actualiza en cada cuadro. */
  function recorre(tl: gsap.core.Timeline, objetivo: Element, t: number) {
    tl.to(lupa, { x: () => lupaSobre(objetivo).x, y: () => lupaSobre(objetivo).y, duration: 0.45, ease: "power2.inOut", onUpdate: actualizaVidrio }, t);
  }
  /** Lo libre del sábado se enciende en lima bajo la lente (en la tira y en su copia). */
  const enciende = (tl: gsap.core.Timeline, i: number, t: number) =>
    tl.to([libres[i], libresCopia[i]], { backgroundColor: LIMA, duration: 0.2, ease: "steps(2)" }, t);

  /* ── Actuaciones ── */
  const actos: Record<number, (tl: gsap.core.Timeline) => void> = {
    // P13: Jorge pide mover su cita. Moli busca la suya con la lupa (la encuentra en el viernes a las
    // 17:00), revisa el sábado (lo libre se enciende en lima) y le ofrece las dos horas. La pausa cambia a
    // media T3: la actuación espera al primer plano.
    13: (tl) => {
      const a = gsap.timeline();
      // La copia de la lupa arranca como la tira: el sábado sin revisar y la cita en el viernes.
      a.call(() => {
        colsCopia.classList.remove("revisada");
        gsap.set(libresCopia, { clearProps: "backgroundColor" });
      }, undefined, 0);
      llega(a, 0, 0);
      a.call(() => moli.cara("concentra"), undefined, 0.3);
      subeTira(a, 0.4);
      // Sale de su lado y se para sobre la cita de Jorge: un latido, ahí está.
      a.set(lupa, { x: () => lupaSobre(jorge).x, y: () => lupaSobre(jorge).y, rotation: 0 }, 0.95);
      a.fromTo(lupa, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.42, ease: "back.out(2)", immediateRender: false, onUpdate: actualizaVidrio }, 0.95);
      a.to([jorge, jorgeCopia], { scale: 1.07, duration: 0.14, yoyo: true, repeat: 1, ease: "power1.inOut" }, 1.4);
      a.to(lupa, { rotation: -5, duration: 0.13, yoyo: true, repeat: 1, ease: "sine.inOut", onUpdate: actualizaVidrio }, 1.4);
      // Luego revisa el sábado: las 10:00 y las 12:30 siguen libres.
      recorre(a, libres[0], 1.85);
      enciende(a, 0, 2.22);
      recorre(a, libres[1], 2.5);
      enciende(a, 1, 2.87);
      a.to(lupa, { scale: 0.3, autoAlpha: 0, duration: 0.22, ease: "power2.in", onUpdate: actualizaVidrio }, 3.2);
      if (!escritorio.matches) bajaTira(a, 3.3);
      moli.habla(a, 3.65, "guino");
      llega(a, 1, 3.8);
      tl.add(a, 0.55);
    },
    // P14: Jorge elige las 10. Moli toma la cita con sus pinzas, la carga del viernes al sábado y la suelta:
    // cae con rebote y se pinta de verde. El viernes a las 17:00 queda libre (lima).
    14: (tl) => {
      llega(tl, 2, 0);
      tl.call(() => moli.cara("concentra"), undefined, 0.15);
      if (!escritorio.matches) subeTira(tl, 0.35);
      // Las pinzas llegan abiertas junto a la orilla de la cita y la pellizcan.
      tl.call(() => pinzas.classList.remove("cerradas"), undefined, 0.9);
      tl.set(pinzas, { x: () => pinzasEnLaCita(34).x, y: () => pinzasEnLaCita(34).y - 18, rotation: 0 }, 0.9);
      tl.fromTo(pinzas, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, 0.9);
      tl.to(pinzas, { x: () => pinzasEnLaCita().x, y: () => pinzasEnLaCita().y, duration: 0.25, ease: "power2.inOut" }, 1.2);
      tl.call(() => pinzas.classList.add("cerradas"), undefined, 1.45);
      tl.set(jorge, { zIndex: 4 }, 1.45);
      tl.to(jorge, { scale: 1.05, duration: 0.1, ease: "power2.out" }, 1.45);
      // La carga: un arco del viernes al sábado; las pinzas siguen a la cita en cada cuadro. Termina un
      // poco arriba del hueco, para soltarla.
      const viaje = { p: 0 };
      let d = { x: 0, y: 0 };
      const ARCO = 30;
      const ALTO = 14;
      const lleva = () => {
        const p = viaje.p;
        gsap.set(jorge, { x: d.x * p, y: d.y * p - Math.sin(p * Math.PI) * ARCO - ALTO * Math.min(1, p * 4) });
        gsap.set(pinzas, pinzasEnLaCita());
      };
      tl.call(() => {
        d = haciaElSabado();
        viaje.p = 0;
      }, undefined, 1.55);
      tl.to(viaje, { p: 1, duration: 0.85, ease: "power1.inOut", onUpdate: lleva }, 1.55);
      // La suelta: las pinzas se abren, la cita cae con rebote y las pinzas se van con Moli.
      tl.call(() => pinzas.classList.remove("cerradas"), undefined, 2.42);
      tl.to(jorge, { y: () => d.y, scale: 1, duration: 0.45, ease: "bounce.out" }, 2.42);
      tl.to(pinzas, { x: "+=54", y: "+=16", autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 2.55);
      tl.fromTo(pinta, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 2.7);
      tl.call(() => moli.cara("feliz"), undefined, 2.8);
      moli.salto(tl, 2.8);
    },
    // P15: baja la tira y le confirma a Jorge la fecha nueva.
    15: (tl) => {
      if (!escritorio.matches) bajaTira(tl, 0);
      moli.habla(tl, 0.35, "feliz");
      llega(tl, 3, 0.5);
    },
  };

  // Una actuación deja todo en el reposo de su pausa (el director la termina antes de cambiar).
  const entradas = Object.fromEntries(
    Object.entries(actos).map(([k, actua]) => [
      k,
      (tl: gsap.core.Timeline) => {
        ultimo = Number(k);
        actua(tl);
      },
    ]),
  );

  /** El Moli que está a cuadro (para la línea viva): de P13 a P15, el de las 16:05. */
  const moliEn = (k: number): Titere | null | undefined => (k >= 13 && k <= 15 ? moli : k > 15 ? null : undefined);
  const reponer = () => {
    manos = null;
    ultimo = -1;
  };

  return { camara, estado, entradas, moliEn, reponer };
}
