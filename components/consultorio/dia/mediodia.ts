import { gsap } from "gsap";
import { crearMoli, type Titere } from "../moli/titere";
import { T2 } from "../pausas";
import { MIRA, anaQuieta, crearAna } from "./ana";
import { HOMBROS } from "./dibujo";
import type { Opciones } from "./manana";

/**
 * El acto de las 11:20: la transición T2 (la cámara se aleja del celular, recorre el mostrador y el
 * reloj gira de 09:00 a 11:20) y la escena 3 (P10 a P12): un paciente pide hablar con el doctor, Moli
 * contesta el cierre de la clínica, le pasa el chat a Ana como estafeta y se va a saltitos; Ana
 * contesta desde el mismo celular. Lo arma el director de `noche/director.ts`, igual que la mañana.
 *
 * Nada de alertas ni avisos para Ana (regla 2): ella ve el chat porque el paciente escribió. Las
 * capacidades, con su fuente, están junto a los textos (`ROTULOS_MEDIODIA` en textos.ts).
 *
 * Dueños: la cámara mueve `.plano-dia`, `.lamina-dia`, `.dia-cerca`, `.mediodia-cerca`, `.rotulos`
 * (la capa) y las manecillas; las actuaciones mueven a Ana, a Moli, la estafeta, el puño y el chat.
 */

/** Cuántos mensajes del chat se ven en cada pausa: la petición y el cierre, el que ya no contesta, el de Ana. */
const BURBUJAS: Record<number, number> = { 10: 2, 11: 3, 12: 4 };
/**
 * El brazo derecho de Ana (grados, en su hombro): alzado hacia Moli para tomar la estafeta y, ya con
 * ella, abajo a su lado. Con el brazo abajo la estafeta cuelga girada desde su punta (GIRO_ABAJO).
 */
const BRAZO_ALZADO = -100;
const BRAZO_ABAJO = -26;
const GIRO_ABAJO = 72;
const [hx, hy] = HOMBROS.der.split(" ").map(Number);
/** Dónde queda la mano de Ana, en su SVG, con el brazo girado `grados`: la punta del brazo (19, 62) girada en el hombro. */
function manoDeAna(grados: number) {
  const a = (grados * Math.PI) / 180;
  const [vx, vy] = [19 - hx, 62 - hy];
  return { x: hx + vx * Math.cos(a) - vy * Math.sin(a), y: hy + vx * Math.sin(a) + vy * Math.cos(a) };
}
/** Cuánto gira la estafeta con el brazo en `grados`: nada alzado, GIRO_ABAJO abajo. */
const giroEstafeta = (grados: number) => (GIRO_ABAJO * (grados - BRAZO_ALZADO)) / (BRAZO_ABAJO - BRAZO_ALZADO);
/** La caja del SVG de Ana (CAJA_ANA): −50 −26 100 154. */
const ANA = { x: -50, y: -26, ancho: 100, alto: 154 };
/** Moli fuera de cuadro, a la derecha (en % de su ancho). */
const FUERA = 125;
/**
 * La cámara de la T2, en unidades del lienzo de 480 de ancho: se abre (ESCALA_ABIERTA) con el
 * mostrador entre el celular (x = 323) y el reloj (x = 392) a media pantalla, y empuja (ESCALA_CELULAR)
 * hasta dejar el celular donde va a estar el del primer plano.
 */
const LIENZO_ANCHO = 480;
const ENTRE_CELULAR_Y_RELOJ = 357;
const CELULAR = 323;
const ESCALA_ABIERTA = 1.6;
const ESCALA_CELULAR = 2.4;

export function armarMediodia(raiz: HTMLElement, { escenario }: Opciones) {
  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;

  const capaRotulos = q(".rotulos");
  const planoDia = q(".plano-dia");
  const laminaDia = q(".lamina-dia");
  const cercaDia = q(".dia-cerca");
  const hora = q(".manecilla-hora");
  const minuto = q(".manecilla-minuto");
  const cerca = q(".mediodia-cerca");
  const chat = q(".tel-mediodia .chat");
  const chatCaja = q(".tel-mediodia .tel-chat");
  const burbujas = Array.from(cerca.querySelectorAll<HTMLElement>(".burbuja"));
  const ana = crearAna(q(".ana-mediodia"));
  const estafeta = q(".estafeta-cerca");
  const puno = q(".puno-cerca");
  const punta = q<SVGCircleElement>(".estafeta-cerca .punta");
  const telCerca = q(".tel-mediodia");
  const encuadreDia = laminaDia.parentElement!;
  const moli = crearMoli(q('[data-moli="mm"]'), "mm-c", "normal");

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
  /** Dónde queda la punta de la estafeta dentro de su capa: se mide una vez, con la capa quieta. */
  let puntaEstafeta: { x: number; y: number } | null = null;
  /** Dónde poner la estafeta (y el puño, que comparte su caja) para que su punta quede en la mano de Ana. */
  function enLaMano(grados = BRAZO_ALZADO, dx = 0, dy = 0) {
    if (!puntaEstafeta) {
      const s = escalaCerca();
      gsap.set([estafeta, puno], { x: 0, y: 0, scale: 1, rotation: 0 });
      const m = enPantalla(estafeta);
      const p = enPantalla(punta);
      puntaEstafeta = { x: (p.cx - m.x) / s, y: (p.cy - m.y) / s };
    }
    // Ana no gira ni se escala: su caja en pantalla basta para ubicar su mano.
    const a = enPantalla(ana.el);
    const mano = manoDeAna(grados);
    const mx = a.x + ((mano.x - ANA.x) / ANA.ancho) * a.w;
    const my = a.y + ((mano.y - ANA.y) / ANA.alto) * a.h;
    const p = aLocal(mx, my);
    return { x: p.x - puntaEstafeta.x + dx, y: p.y - puntaEstafeta.y + dy };
  }
  /** La estafeta en la mano de Ana con el brazo en `grados`: gira desde su punta, que es lo que ella agarra. */
  function estafetaConBrazo(grados: number) {
    const lugar = enLaMano(grados);
    const origen = `${puntaEstafeta!.x}px ${puntaEstafeta!.y}px`;
    gsap.set(estafeta, { ...lugar, transformOrigin: origen, rotation: giroEstafeta(grados), scale: 1, autoAlpha: 1 });
  }
  /** Como en WhatsApp: el último mensaje queda abajo y empuja a los anteriores hacia arriba. */
  function desplazamiento(n: number) {
    const ultima = burbujas[n - 1];
    const estilo = getComputedStyle(chatCaja);
    const disponible = chatCaja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    return disponible - (ultima.offsetTop + ultima.offsetHeight);
  }
  const voltea = (aLaDerecha: boolean) => moli.el.classList.toggle("mira-derecha", aLaDerecha);

  /* ── La cámara: T2, atada al scroll ── */
  // GSAP guarda el centrado de la lámina (translate: -50%) a veces como xPercent y a veces como x en px
  // (medido: xPercent −50 en 390 px, x −358 px en 1280). Por eso la cámara la mueve con x relativa (+=):
  // sirve igual en los dos casos. Las cuentas usan el origen de la lámina, que no se mueve al escalar.
  const enLamina = (u: number) => (u / LIENZO_ANCHO) * laminaDia.offsetWidth;
  const origenX = () => parseFloat(getComputedStyle(laminaDia).transformOrigin);
  /** Dónde queda en pantalla el origen de la lámina al terminar de abrirse (lo usa el empujón). */
  let origenAbierta = 0;
  function abre() {
    const r = laminaDia.getBoundingClientRect();
    const s0 = Number(gsap.getProperty(laminaDia, "scaleX")) || 1;
    const o = origenX();
    const e = encuadreDia.getBoundingClientRect();
    const meta = e.left + e.width / 2;
    origenAbierta = meta - (enLamina(ENTRE_CELULAR_Y_RELOJ) - o) * ESCALA_ABIERTA;
    // Hoy el origen está en r.left + o·s0: lo que falta para llevarlo a origenAbierta.
    return `+=${origenAbierta - (r.left + o * s0)}`;
  }
  function empuja() {
    const meta = telCerca.offsetLeft + telCerca.offsetWidth / 2;
    return `+=${meta - (enLamina(CELULAR) - origenX()) * ESCALA_CELULAR - origenAbierta}`;
  }
  function camara(tl: gsap.core.Timeline) {
    const t = T2.inicio;
    tl
      // El primer plano de las 09:00 se aleja y vuelve el plano general, cerca del mostrador. Los rótulos
      // se apartan mientras tanto: el reloj queda donde suelen ir.
      .set(cerca, { display: "block" }, t)
      .to(capaRotulos, { opacity: 0, duration: 0.06 }, t)
      // El plano general se prende completo DEBAJO del primer plano (que lo tapa) y luego el primer plano
      // se va. Al revés, al entrar a las 11:20: el plano general se apaga hasta que el primer plano nuevo
      // lo tapa entero. Dos capas cruzadas a media opacidad dejan ver la tinta del fondo: un velo gris con
      // doble imagen (lo vio Diego el 5-oct; scripts/r1-velo.mjs lo mide).
      .set(planoDia, { opacity: 1 }, t)
      .to(cercaDia, { autoAlpha: 0, scale: 0.96, ease: "power1.in", duration: 0.08 }, t)
      // La cámara se abre y recorre el mostrador hacia el celular de la clínica, y el reloj gira de 09:00
      // a 11:20: el minutero da dos vueltas y un tercio.
      .to(laminaDia, { scale: ESCALA_ABIERTA, x: abre, ease: "power1.inOut", duration: 0.34 }, t + 0.06)
      .fromTo(hora, { rotation: 630 }, { rotation: 700, ease: "power1.inOut", duration: 0.3, immediateRender: false }, t + 0.1)
      .fromTo(minuto, { rotation: 1080 }, { rotation: 1920, ease: "power1.inOut", duration: 0.3, immediateRender: false }, t + 0.1)
      // Empujón al celular (se queda a media pantalla) y corte al primer plano de las 11:20.
      .to(laminaDia, { scale: ESCALA_CELULAR, x: empuja, ease: "power2.in", duration: 0.26 }, T2.llega - 0.1)
      .fromTo(cerca, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.12, immediateRender: false }, T2.llega + 0.08)
      .set(planoDia, { opacity: 0 }, T2.llega + 0.2)
      .to(capaRotulos, { opacity: 1, duration: 0.1 }, T2.llega + 0.12);
  }

  /* ── Reposo: lo que se ve quieto en cada pausa ── */
  /**
   * Antes de las 11:20 el reposo es el del CSS (`.cine` en mediodia.css): el chat vacío, Ana con los
   * brazos abajo, Moli en su lugar y la estafeta guardada. Al arrancar no se toca nada.
   */
  let ultimo = 9;
  function estado(pausa: number) {
    // Desde las 16:05 esta capa ya se fue: se queda como en P12, sin medir nada (la estafeta mide).
    const k = Math.min(Math.max(pausa, 9), 12);
    if (k === ultimo) return;
    ultimo = k;
    const n = BURBUJAS[k] ?? 0;
    burbujas.forEach((b, i) => gsap.set(b, { autoAlpha: i < n ? 1 : 0, scale: 1, y: 0 }));
    // El chat se mide solo cuando se ve (medirlo obliga a calcular el diseño de la página).
    if (n) gsap.set(chat, { y: desplazamiento(n) });
    // Desde P11 Ana tiene la estafeta en la mano alzada y Moli ya se fue, volteado hacia la salida.
    const conEstafeta = k >= 11;
    anaQuieta(ana, k >= 10 ? MIRA.arriba : MIRA.frente);
    // En P11 la tiene alzada, recién tomada; en P12 ya la bajó a su lado.
    const brazo = k >= 12 ? BRAZO_ABAJO : BRAZO_ALZADO;
    if (conEstafeta) gsap.set(ana.der, { rotation: brazo, svgOrigin: HOMBROS.der });
    gsap.set(puno, { autoAlpha: 0 });
    if (conEstafeta) estafetaConBrazo(brazo);
    else gsap.set(estafeta, { autoAlpha: 0, rotation: 0 });
    moli.quieto(conEstafeta ? "calla" : "normal");
    voltea(conEstafeta);
    gsap.set(moli.el, { xPercent: conEstafeta ? FUERA : 0 });
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

  /* ── Actuaciones ── */
  const actos: Record<number, (tl: gsap.core.Timeline) => void> = {
    // P10: el paciente pide al doctor, Ana lo ve en el celular (nadie le avisa: el paciente escribió) y
    // Moli contesta el cierre de la clínica. La pausa cambia a media T2: la actuación espera al primer plano.
    10: (tl) => {
      const a = gsap.timeline();
      llega(a, 0, 0);
      a.to(ana.ojos, { ...MIRA.arriba, duration: 0.2 }, 0.35);
      a.call(() => moli.cara("concentra"), undefined, 0.3);
      moli.habla(a, 0.95, "normal");
      llega(a, 1, 1.1);
      tl.add(a, 0.55);
    },
    // P11: Moli le pasa el chat a Ana como estafeta: la estafeta sale de su lado, Ana alza el brazo y la
    // toma, el puño la suelta y regresa. Moli se queda callado (guiño, boca de línea), se voltea y se va a
    // saltitos. El paciente vuelve a escribir y ya nadie le contesta con IA.
    11: (tl) => {
      tl.to(ana.ojos, { ...MIRA.moli, duration: 0.2 }, 0);
      tl.set([estafeta, puno], { x: () => enLaMano(BRAZO_ALZADO, 70, 14).x, y: () => enLaMano(BRAZO_ALZADO, 70, 14).y, rotation: 0 }, 0.15);
      tl.fromTo([estafeta, puno], { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, 0.15);
      tl.to(ana.der, { rotation: BRAZO_ALZADO, svgOrigin: HOMBROS.der, duration: 0.4, ease: "power2.out" }, 0.4);
      tl.to([estafeta, puno], { x: () => enLaMano().x, y: () => enLaMano().y, duration: 0.5, ease: "power2.inOut" }, 0.45);
      // La toma: un apretón, y el puño suelta y regresa con Moli.
      tl.to(estafeta, { scale: 1.08, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.95);
      tl.to(ana.el, { yPercent: -3, duration: 0.1, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.98);
      tl.to(puno, { x: "+=56", y: "+=8", autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 1.15);
      tl.call(() => moli.cara("calla"), undefined, 1.25);
      tl.call(() => voltea(true), undefined, 1.75);
      moli.saltitos(tl, 1.8, FUERA, 4);
      llega(tl, 2, 2.9);
      tl.to(ana.ojos, { ...MIRA.arriba, duration: 0.2 }, 3.05);
    },
    // P12: Ana contesta desde el mismo celular, con la estafeta en la mano. Su mensaje es crema: lo
    // escribió una persona.
    12: (tl) => {
      tl.to(ana.ojos, { ...MIRA.arriba, duration: 0.2 }, 0);
      // Baja el brazo con la estafeta: la estafeta sigue a su mano y cuelga girando desde la punta.
      tl.to(
        ana.der,
        {
          rotation: BRAZO_ABAJO,
          svgOrigin: HOMBROS.der,
          duration: 0.45,
          ease: "power2.inOut",
          onUpdate: () => estafetaConBrazo(Number(gsap.getProperty(ana.der, "rotation"))),
        },
        0.05,
      );
      // Teclea con la otra mano: tres toquecitos hacia el celular.
      tl.to(ana.izq, { rotation: 128, svgOrigin: HOMBROS.izq, duration: 0.25, ease: "power2.out" }, 0.5);
      tl.to(ana.izq, { rotation: 118, svgOrigin: HOMBROS.izq, duration: 0.09, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.75);
      tl.to(ana.izq, { rotation: 0, svgOrigin: HOMBROS.izq, duration: 0.35, ease: "power2.inOut" }, 1.35);
      llega(tl, 3, 1.3);
      tl.to(ana.el, { yPercent: -3, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.85);
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

  /** El Moli que está a cuadro (para la línea viva): P10 es suyo; desde P11 ya se fue (nadie). */
  const moliEn = (k: number): Titere | null | undefined => (k === 10 ? moli : k > 10 ? null : undefined);
  const reponer = () => {
    puntaEstafeta = null;
    ultimo = -1;
  };

  return { camara, estado, entradas, moliEn, reponer };
}
