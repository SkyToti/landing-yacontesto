import { gsap } from "gsap";
import { crearMoli, type Titere } from "../moli/titere";
import { T1 } from "../pausas";
import { MIRA, anaQuieta, camina, crearAna } from "./ana";
import { HOMBROS } from "./dibujo";

/**
 * El acto de la mañana: la transición T1 (la hoja de la noche se arranca) y la escena de las 09:00
 * (P7 a P9). Lo arma el director de `noche/director.ts`, con su mismo sistema: la CÁMARA va atada al
 * scroll y cada PAUSA dispara una actuación con su propio tiempo.
 *
 * Dueños (regla de la hoja): la cámara mueve `.plano-general` (la hoja que se arranca), `.plano-dia`,
 * `.lamina-dia`, `.dia-cerca`, `.rotulos` (la capa entera), la bolita, las manecillas y el cielo;
 * las actuaciones mueven a Ana, el letrero, a Moli, la computadora, el celular, la mano y la nota.
 */

export type Opciones = { escenario: HTMLElement; escritorio: MediaQueryList };

export function armarManana(raiz: HTMLElement, { escenario, escritorio }: Opciones) {
  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;

  const general = q(".plano-general");
  const capaRotulos = q(".rotulos");
  const planoDia = q(".plano-dia");
  const laminaDia = q(".lamina-dia");
  const cercaDia = q(".dia-cerca");
  const bolita = q(".bolita");
  const bolitaDibujo = q(".bolita svg");
  const luna = q(".cielo .luna");
  const sol = q(".cielo .sol");
  const hora = q(".manecilla-hora");
  const minuto = q(".manecilla-minuto");
  const letrero = q(".letrero");
  const cerrado = q(".letrero-cerrado");
  const abierto = q(".letrero-abierto");
  const anaG = crearAna(q(".ana-general"));
  const anaC = crearAna(q(".ana-cerca"));
  const ancla = q(".ancla-ana");
  const compu = q(".compu");
  const citaCompu = q(".compu .blq-cita");
  const nota = q(".nota-agendo");
  const tel = q(".tel-dia");
  const chat = q(".tel-dia .chat");
  const chatCaja = q(".tel-dia .tel-chat");
  const burbujas = Array.from(tel.querySelectorAll<HTMLElement>(".burbuja"));
  const mano = q(".senala-cerca");
  const dedo = q<SVGPathElement>(".senala-cerca .dedo");
  const moliD = crearMoli(q('[data-moli="md"]'), "md-c", "dormita");
  const moliDC = crearMoli(q('[data-moli="mdc"]'), "mdc-c", "normal");

  /* ── Medidas en el sistema del primer plano de día (la cámara lo escala de 0.92 a 1) ── */
  const escalaCerca = () => Number(gsap.getProperty(cercaDia, "scale")) || 1;
  function enPantalla(el: Element) {
    const e = escenario.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - e.left, y: r.top - e.top, w: r.width, h: r.height, cy: r.top - e.top + r.height / 2 };
  }
  function aLocal(px: number, py: number) {
    const s = escalaCerca();
    const ox = escenario.clientWidth / 2;
    const oy = escenario.clientHeight / 2;
    return { x: ox + (px - ox) / s, y: oy + (py - oy) / s };
  }
  /** Dónde poner la mano para que la punta del dedo toque la cita (el dedo nunca se estira). */
  let puntaDedo: { x: number; y: number } | null = null;
  function manoSobreCita() {
    if (!puntaDedo) {
      const s = escalaCerca();
      gsap.set(mano, { x: 0, y: 0, scale: 1, rotation: 0 });
      const m = enPantalla(mano);
      const d = enPantalla(dedo);
      puntaDedo = { x: (d.x - m.x) / s, y: (d.cy - m.y) / s };
    }
    const c = enPantalla(citaCompu);
    const p = aLocal(c.x + c.w - (escritorio.matches ? 10 : 4), c.cy + 2);
    return { x: p.x - puntaDedo.x, y: p.y - puntaDedo.y };
  }
  /** Cuánto camina Ana en P9: de su lugar junto a la computadora al lado del celular. */
  const destinoAna = () => ancla.offsetLeft - anaC.el.offsetLeft;
  /** Moli se hace a un lado, hacia la orilla (en el celular se asoma con medio cuerpo fuera). */
  const aUnLado = () => (escritorio.matches ? 42 : 60);
  function desplazamientoChat() {
    const ultima = burbujas[burbujas.length - 1];
    const estilo = getComputedStyle(chatCaja);
    const disponible = chatCaja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    return Math.min(0, disponible - (ultima.offsetTop + ultima.offsetHeight));
  }

  /* ── La cámara: T1 y el empujón a la computadora, atados al scroll ── */
  function camara(tl: gsap.core.Timeline) {
    const t = T1.inicio;
    tl
      // El día ya está debajo; la hoja de la noche se desprende por arriba (asoma su orilla de zigzag)...
      // Las capas de día empiezan en display: none (dia.css): la cámara las prende justo antes de usarlas.
      .set(planoDia, { display: "block", autoAlpha: 1 }, t)
      .fromTo(capaRotulos, { opacity: 1 }, { opacity: 0, duration: 0.08 }, t)
      .fromTo(general, { yPercent: 0, rotation: 0, transformOrigin: "100% 0%" }, { yPercent: 4, rotation: -1.4, ease: "power1.in", duration: 0.12 }, t)
      // ...y se arranca hacia abajo, girando, hasta salir de la pantalla.
      .to(general, { yPercent: 135, rotation: 7, ease: "power2.in", duration: 0.42 }, t + 0.12)
      // La hoja hecha bolita sale volando por la derecha.
      .set(bolita, { autoAlpha: 1 }, t + 0.36)
      .fromTo(bolita, { xPercent: 0 }, { xPercent: 64, ease: "power1.in", duration: 0.34, immediateRender: false }, t + 0.36)
      .fromTo(bolita, { yPercent: 0 }, { yPercent: -62, ease: "power2.out", duration: 0.34, immediateRender: false }, t + 0.36)
      .fromTo(bolitaDibujo, { rotation: 0, scale: 0.55 }, { rotation: 420, scale: 1, ease: "none", duration: 0.34 }, t + 0.36)
      .set(bolita, { autoAlpha: 0 }, t + 0.7)
      // El reloj gira de 23:49 a 09:00 (el minutero da tres vueltas: es caricatura) y sale el sol.
      .fromTo(minuto, { rotation: 294 }, { rotation: 1080, ease: "power1.inOut", duration: 0.4 }, t + 0.2)
      .fromTo(hora, { rotation: 354.5 }, { rotation: 630, ease: "power1.inOut", duration: 0.4 }, t + 0.2)
      .fromTo(luna, { yPercent: 0 }, { yPercent: 105, ease: "power1.in", duration: 0.2 }, t + 0.24)
      .fromTo(sol, { yPercent: 105, autoAlpha: 1 }, { yPercent: 0, ease: "power2.out", duration: 0.26 }, t + 0.36)
      .to(capaRotulos, { opacity: 1, duration: 0.12 }, t + 0.5)
      // P7 → P8: empujón a la computadora y corte al primer plano.
      .fromTo(laminaDia, { scale: 1 }, { scale: 2.3, ease: "power2.in", duration: 0.42 }, 5.5)
      // Se prende a media P7 y no junto al empujón: si su primer cálculo de diseño cae en el mismo cuadro
      // en que P8 mide la mano, sale una tarea larga (medido: 52–60 ms con la CPU 4× más lenta).
      .set(cercaDia, { display: "block" }, 5.2)
      .fromTo(cercaDia, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.36, immediateRender: false }, 5.64)
      // El plano general se apaga cuando el primer plano ya lo tapa entero, no a la vez: dos capas cruzadas
      // a media opacidad dejan ver la tinta del fondo (un velo gris con doble imagen; scripts/r1-velo.mjs).
      .set(planoDia, { opacity: 0 }, 6.0);
  }

  /* ── Reposo: lo que se ve quieto en cada pausa ── */
  /**
   * De P0 a P6 el día está tapado y su reposo es el mismo: el de P6, que es lo que ya dice el CSS
   * (`.cine` en dia.css). Así, al arrancar no se toca nada del día: con la CPU 4× más lenta eso le
   * quitaba ~18 ms a la tarea de armar la escena. Solo se reacomoda cuando el reposo cambia.
   */
  let ultimo = 6;
  function estado(pausa: number) {
    // Desde las 11:20 esta capa ya se fue: se queda como en P9, sin volver a medir el chat.
    const k = Math.min(Math.max(pausa, 6), 9);
    if (k === ultimo) return;
    ultimo = k;
    // Plano general: antes de las 09:00 Ana no ha llegado, el letrero dice CERRADO y Moli dormita.
    const abrio = k >= 7;
    anaQuieta(anaG, abrio ? MIRA.moli : MIRA.frente);
    gsap.set(anaG.el, { xPercent: abrio ? 0 : -150, autoAlpha: abrio ? 1 : 0 });
    gsap.set(letrero, { scaleX: 1, rotation: 0 });
    gsap.set(cerrado, { autoAlpha: abrio ? 0 : 1 });
    gsap.set(abierto, { autoAlpha: abrio ? 1 : 0 });
    moliD.quieto(abrio ? "normal" : "dormita");

    // Primer plano: la computadora (P8) y luego el celular (P9).
    const celular = k >= 9;
    gsap.set(compu, { y: 0, autoAlpha: celular ? 0 : 1 });
    gsap.set(citaCompu, { scale: 1 });
    gsap.set(nota, { autoAlpha: k === 8 ? 1 : 0, clipPath: "inset(0% 0% 0% 0%)" });
    // El chat se acomoda solo cuando se ve: medirlo obliga a calcular el diseño de toda la página, y
    // al arrancar eso alarga la tarea larga de armar la escena.
    if (celular) gsap.set(chat, { y: desplazamientoChat() });
    gsap.set(tel, { yPercent: celular ? 0 : 110, autoAlpha: celular ? 1 : 0 });
    if (k === 8) gsap.set(mano, { ...manoSobreCita(), autoAlpha: 1, scale: 1, rotation: 0 });
    else gsap.set(mano, { autoAlpha: 0 });
    moliDC.quieto(celular ? "feliz" : k === 8 ? "guino" : "normal");
    gsap.set(moliDC.el, { xPercent: celular ? aUnLado() : 0 });
    anaQuieta(anaC, celular ? MIRA.celular : k === 8 ? MIRA.compu : MIRA.frente);
    gsap.set(anaC.el, { x: celular ? destinoAna() : 0 });
  }

  function escribe(tl: gsap.core.Timeline, el: HTMLElement, t: number) {
    tl.fromTo(el, { autoAlpha: 1, clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "steps(6)" }, t);
  }

  /* ── Actuaciones ── */
  const actos: Record<number, (tl: gsap.core.Timeline) => void> = {
    // P7: Ana llega, voltea el letrero a ABIERTO y Moli despierta. La pausa cambia cuando el arrancón
    // va a la mitad: la actuación espera a que la hoja de la noche termine de salir.
    7: (tl) => {
      const a = gsap.timeline();
      a.set(anaG.el, { xPercent: -150 }, 0);
      a.fromTo(anaG.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
      camina(a, anaG, 0, 1.1, { xPercent: 0 });
      a.to(anaG.izq, { rotation: 150, svgOrigin: HOMBROS.izq, duration: 0.32, ease: "power2.out" }, 1.2);
      a.to(letrero, { scaleX: 0, duration: 0.13, ease: "power2.in" }, 1.45);
      a.set(cerrado, { autoAlpha: 0 }, 1.58).set(abierto, { autoAlpha: 1 }, 1.58);
      a.to(letrero, { scaleX: 1, duration: 0.24, ease: "back.out(2)" }, 1.58);
      a.fromTo(letrero, { rotation: 0 }, { rotation: 6, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.7);
      a.to(anaG.izq, { rotation: 0, svgOrigin: HOMBROS.izq, duration: 0.4, ease: "power2.inOut" }, 2.05);
      a.call(() => moliD.cara("sorpresa"), undefined, 1.75);
      moliD.salto(a, 1.8);
      a.call(() => moliD.cara("feliz"), undefined, 2.25);
      a.to(anaG.ojos, { ...MIRA.moli, duration: 0.2 }, 2.3);
      a.call(() => moliD.cara("normal"), undefined, 3.0);
      tl.add(a, 0.45);
    },
    // P8: Moli le enseña la cita a Ana con la mano (sin estirar el dedo), escribe la nota y le guiña.
    8: (tl) => {
      tl.set(mano, { x: () => manoSobreCita().x + 80, y: () => manoSobreCita().y + 60, rotation: 0 }, 0.2);
      tl.fromTo(
        mano,
        { autoAlpha: 0, scale: 0.4 },
        { autoAlpha: 1, scale: 1, x: () => manoSobreCita().x, y: () => manoSobreCita().y, duration: 0.5, ease: "back.out(1.6)", immediateRender: false },
        0.2,
      );
      // Dos toquecitos sobre la cita, y la cita contesta con un latido.
      tl.to(mano, { x: "-=9", duration: 0.09, yoyo: true, repeat: 3, ease: "power1.inOut" }, 0.8);
      tl.to(citaCompu, { scale: 1.035, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.86);
      tl.to(anaC.ojos, { ...MIRA.compu, duration: 0.2 }, 0.5);
      escribe(tl, nota, 1.25);
      tl.to(anaC.el, { yPercent: -3, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.5);
      tl.call(() => moliDC.cara("guino"), undefined, 2.0);
    },
    // P9: el celular de la clínica con la plática de anoche; Moli se hace a un lado y Ana toma su lugar.
    9: (tl) => {
      tl.to(mano, { autoAlpha: 0, x: "+=60", duration: 0.25, ease: "power2.in" }, 0);
      tl.to(compu, { y: 50, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 0.1);
      tl.set(chat, { y: desplazamientoChat }, 0);
      tl.fromTo(tel, { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0.4);
      tl.call(() => moliDC.cara("feliz"), undefined, 0.3);
      moliDC.salto(tl, 0.3);
      tl.to(moliDC.el, { xPercent: aUnLado, duration: 0.6, ease: "power2.inOut" }, 0.62);
      camina(tl, anaC, 0.55, 0.9, { x: destinoAna });
      tl.to(anaC.ojos, { ...MIRA.celular, duration: 0.2 }, 1.45);
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

  /** El Moli que está a cuadro en la pausa k (para la línea viva), si es de este acto (si no, undefined). */
  const moliEn = (k: number): Titere | null | undefined => (k === 7 ? moliD : k >= 8 ? moliDC : undefined);
  const reponer = () => {
    puntaDedo = null;
    ultimo = -1;
  };

  return { camara, estado, entradas, moliEn, reponer };
}
