import { gsap } from "gsap";
import { crearMoli, type Titere } from "../moli/titere";
import { PAUSAS, PAUSAS_CIFRAS, T4, T5 } from "../pausas";
import { MIRA, anaQuieta, camina, crearAna } from "./ana";
import { HOMBROS } from "./dibujo";
import { CLINICA, PUERTA, elige, origenPara, yPara } from "./encuadres";
import type { Opciones } from "./manana";

/**
 * El acto de las 19:00: la transición T4 (corte a la toma abierta de la clínica entera, donde el reloj
 * llega a 19:00, y la cámara se acerca a la recepción), P16 (Ana se despide con la mano, voltea el letrero
 * a CERRADO y se va), la transición T5 (el sol se mete, sale la luna y la noche entra por la ventana
 * hasta tapar la pantalla) y la escena 5, P17 a P20: el celular enciende su luz, Moli se acomoda la
 * diadema y se queda de guardia, y las tres cifras cruzan la pantalla con el scroll, una por pausa.
 * Lo arma el director de `noche/director.ts`, igual que los otros actos. Los textos y el cotejo de
 * cada cifra están en `ROTULOS_ANOCHECER` (textos.ts).
 *
 * Dueños: la cámara mueve `.plano-dia`, `.lamina-dia`, `.tarde-cerca`, `.rotulos` (la capa), las
 * manecillas, el cielo, el iris de la noche, `.lamina-anochecer` y las cifras; las actuaciones mueven a
 * Ana, el letrero, a los dos Molis, su diadema y la luz del celular.
 */

/** Las cuentas de la T5, en unidades del lienzo de 480 de ancho (los encuadres de la T4 están en encuadres.ts). */
const LIENZO_ANCHO = 480;
/** El centro de la ventana: de ahí entra la noche. */
const VENTANA = { x: 101, y: 486 };
/** La luz del celular (la de las 23:47): en el plano de las 19:00 queda abajo, entre el texto y la pastilla. */
const LUZ = { x: 318, y: 600, r: 196 };
/** El iris arranca del tamaño del vidrio (radio en px). */
const IRIS_INICIAL = 18;

type Medidas = {
  /** Cuánto se mueve la lámina de día en el corte para quedar en la toma abierta. */
  dx: number;
  /** Y cuánto, de la toma abierta a la puerta. */
  dxPuerta: number;
  /** El centro de la ventana en pantalla (relativo al escenario) y el radio de la caja del iris. */
  cx: number;
  cy: number;
  R: number;
  /** La escala del iris al empezar (del tamaño del vidrio) y al terminar (tapa la esquina más lejana). */
  s0: number;
  s1: number;
  /** La lámina de la noche en la puerta, igual que la de día. */
  xPuerta: number;
};
/** El plano de las 19:00: la lámina de la noche, con su luz entre el texto y la pastilla. */
type Plano19 = { x: number; y: number; escala: number };

export function armarAnochecer(raiz: HTMLElement, { escenario, escritorio }: Opciones) {
  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;

  const capaRotulos = q(".rotulos");
  const planoDia = q(".plano-dia");
  const laminaDia = q(".lamina-dia");
  const encuadreDia = laminaDia.parentElement!;
  const hora = q(".manecilla-hora");
  const minuto = q(".manecilla-minuto");
  const luna = q(".cielo .luna");
  const sol = q(".cielo .sol");
  const letrero = q(".letrero");
  const cerrado = q(".letrero-cerrado");
  const abierto = q(".letrero-abierto");
  const anaG = crearAna(q(".ana-general"));
  const moliD = crearMoli(q('[data-moli="md"]'), "md-c", "normal");
  const cercaTarde = q(".tarde-cerca");
  const plano = q(".plano-anochecer");
  const iris = q(".anochecer-iris");
  const contenido = q(".anochecer-contenido");
  const lamina = q(".lamina-anochecer");
  const luz = q(".luz-siete");
  const moliN = crearMoli(q('[data-moli="mv"]'), "mv-c", "normal");
  const diadema = moliN.el.querySelector<SVGGElement>(".diadema")!;
  const capaCifras = q(".cifras");
  const cifras = Array.from(capaCifras.querySelectorAll<HTMLElement>(".cifra"));
  const rotulos19 = [17, 18, 19, 20].map((k) => q(`.rotulo[data-rotulo="${k}"]`));
  const pastilla = document.querySelector<HTMLElement>(".pastilla");

  /* ── Las mediciones: UNA por transición, al arrancar cada una ── */
  // Como en la T2 y la T3: GSAP guarda el centrado de la lámina de día a veces como xPercent y a veces
  // como x en px, así que la cámara la mueve con x relativa (+=), calculada con la geometría real. El
  // origen de la lámina no se mueve al escalar: en pantalla está en r.left + o·s.
  // La lámina de la noche tiene el mismo CSS, pero se centra con margen y no con translate: su x es
  // solo lo que pone la cámara. De aquí sale también lo que la T5 necesita de la puerta (el centro del
  // iris y la lámina de la noche encuadrada igual que la de día): a media T5 la lámina de día ya no se
  // vuelve a medir.
  let m: Medidas | null = null;
  function mide(): Medidas {
    const esc = escenario.getBoundingClientRect();
    const r = laminaDia.getBoundingClientRect();
    const e = encuadreDia.getBoundingClientRect();
    const s0 = Number(gsap.getProperty(laminaDia, "scaleX")) || 1;
    const [ox, oy] = getComputedStyle(laminaDia).transformOrigin.split(" ").map(parseFloat);
    const w = laminaDia.offsetWidth;
    const k = w / LIENZO_ANCHO;
    const puerta = elige(PUERTA, escritorio.matches);
    // Dónde queda en pantalla el origen de la lámina en la toma abierta y con la cámara en la puerta (la
    // cámara solo mueve x; el origen no se mueve al escalar).
    const origenClinica = origenPara(laminaDia, escenario, elige(CLINICA, escritorio.matches));
    const origenX = origenPara(laminaDia, escenario, puerta);
    const origenY = r.top + oy * s0;
    // La lámina de la noche sin transformar: centrada en su encuadre, igual que la de día.
    const izquierda = e.left + (e.width - w) / 2;
    const cx = origenX + (VENTANA.x * k - ox) * puerta.escala - esc.left;
    const cy = origenY + (VENTANA.y * k - oy) * puerta.escala - esc.top;
    // La caja del iris mide 2·(ancho + alto) de lado (CSS): su radio alcanza cualquier esquina.
    const W = escenario.clientWidth;
    const H = escenario.clientHeight;
    const R = W + H;
    const lejos = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    m = {
      dx: origenClinica - (r.left + ox * s0),
      dxPuerta: origenX - origenClinica,
      cx,
      cy,
      R,
      s0: IRIS_INICIAL / R,
      s1: Math.min(1, (lejos + 24) / R),
      xPuerta: origenX - (izquierda + ox),
    };
    return m;
  }

  /**
   * La medición de la T5: UNA, al arrancarla (la noche, las cifras y la luz ya están prendidas desde la
   * T4, así que su diseño ya está calculado). El plano de las 19:00 deja la luz del celular entre lo
   * más bajo del texto (en el celular, el rótulo más largo debajo de su cifra; en escritorio, las cifras)
   * y la pastilla, tan grande como quepa sin pasar del tamaño de las 23:47. Los rótulos y las cifras se
   * miden con offsetTop: la cámara y los cambios de rótulo los mueven con transform y no cuentan.
   */
  let p19: Plano19 = { x: 0, y: 0, escala: 1 };
  function mideNoche() {
    const enc = lamina.parentElement!;
    const k = lamina.offsetWidth / LIENZO_ANCHO;
    const [ox, oy] = getComputedStyle(lamina).transformOrigin.split(" ").map(parseFloat);
    const textos = [...cifras, ...(escritorio.matches ? [] : rotulos19)];
    const abajo = Math.max(...textos.map((el) => el.offsetTop + el.offsetHeight));
    const esc = escenario.getBoundingClientRect();
    const tope = (pastilla ? pastilla.getBoundingClientRect().top - esc.top : escenario.clientHeight - 86) - 16;
    const escala = Math.min(1, Math.max(0.6, (tope - abajo - 16) / (1.85 * LUZ.r * k)));
    const radio = LUZ.r * k * escala;
    // A dónde va el centro de la luz: a dos tercios del encuadre (como a las 23:47) y casi tocando la pastilla.
    const lx = enc.offsetLeft + 0.66 * enc.offsetWidth;
    const ly = tope - 0.85 * radio;
    // Sin transformar, el origen de la lámina está en (izquierda + ox, arriba + oy) y no se mueve al escalar.
    const izquierda = enc.offsetLeft + lamina.offsetLeft;
    const arriba = enc.offsetTop + lamina.offsetTop;
    p19 = {
      escala,
      x: lx - (izquierda + ox + (LUZ.x * k - ox) * escala),
      y: ly - (arriba + oy + (LUZ.y * k - oy) * escala),
    };
  }

  /**
   * El iris de la noche: la ventana redonda crece (s) desde el vidrio y el contenido se encoge (1/s)
   * alrededor del mismo punto. El producto es 1: en pantalla el dibujo se queda quieto y nada se
   * redibuja (el mismo truco que el cierre de P6).
   */
  const abre = { p: 0 };
  function pintaIris() {
    if (!m) return;
    const s = m.s0 + (m.s1 - m.s0) * abre.p;
    gsap.set(iris, { x: m.cx - m.R, y: m.cy - m.R, scale: s });
    gsap.set(contenido, { x: m.R - m.cx / s, y: m.R - m.cy / s, scale: 1 / s });
  }

  /* ── La cámara: T4, T5 y las cifras, atadas al scroll ── */
  function camara(tl: gsap.core.Timeline) {
    const t = T4.inicio;
    tl
      // El título se va antes del corte: con el corte encima, quedaba sobre el dibujo (Diego, 9-oct).
      .to(capaRotulos, { opacity: 0, duration: 0.035 }, t - 0.045)
      // Corte del primer plano de las 16:05 a la toma abierta de la clínica entera, en el mismo instante (sin
      // fundido: dos capas a media opacidad se ven encimadas; scripts/r1-recorrido.mjs, 7-oct).
      .set(planoDia, { opacity: 1 }, t)
      .set(cercaTarde, { autoAlpha: 0 }, t)
      .set(
        laminaDia,
        {
          scale: () => elige(CLINICA, escritorio.matches).escala,
          x: () => `+=${mide().dx}`,
          y: () => yPara(escenario, elige(CLINICA, escritorio.matches)),
        },
        t,
      )
      // Con la clínica a cuadro, el reloj gira de 16:05 a 19:00: el minutero da dos vueltas y once doceavos.
      .fromTo(hora, { rotation: 842.5 }, { rotation: 930, ease: "power1.inOut", duration: 0.22, immediateRender: false }, t + 0.02)
      .fromTo(minuto, { rotation: 3630 }, { rotation: 4680, ease: "power1.inOut", duration: 0.22, immediateRender: false }, t + 0.02)
      // Las capas de las 19:00 se prenden con la cámara en marcha, lejos de la medición (el corte) y de la
      // pausa (11.375), en dos tiempos: primero el dibujo de la noche (dentro de un iris todavía oculto) y
      // luego su luz, Moli y las cifras (fuera de cuadro, a la derecha). Así, cuando la T5 mide, su diseño
      // ya está calculado.
      .set(plano, { display: "block" }, t + 0.15)
      // Y se acerca despacio a la recepción entera, donde Ana se despide.
      .to(
        laminaDia,
        {
          scale: () => elige(PUERTA, escritorio.matches).escala,
          x: () => `+=${m?.dxPuerta ?? 0}`,
          // En la puerta la lámina vuelve a su altura: la noche de la T5 se encuadra igual, con y = 0.
          y: () => yPara(escenario, elige(PUERTA, escritorio.matches)),
          ease: "power1.inOut",
          duration: 0.26,
        },
        T4.empuja,
      )
      .set([luz, moliN.el, capaCifras], { display: "block" }, T4.llega - 0.01)
      // El consultorio ya salió de cuadro: la lámina vuelve a recortar, para que Ana salga por su orilla.
      .set(laminaDia, { overflow: "hidden" }, T4.llega)
      .to(capaRotulos, { opacity: 1, duration: 0.1 }, T4.llega + 0.02);

    const t5 = T5.inicio;
    tl
      // El sol se mete y sale la luna (al revés que en la T1).
      .call(mideNoche, undefined, t5)
      .fromTo(sol, { yPercent: 0 }, { yPercent: 105, ease: "power1.in", duration: 0.14, immediateRender: false }, t5)
      .fromTo(luna, { yPercent: 105 }, { yPercent: 0, ease: "power2.out", duration: 0.16, immediateRender: false }, t5 + 0.06)
      .to(capaRotulos, { opacity: 0, duration: 0.06 }, t5 + 0.08)
      // La noche entra por la ventana: su lámina, encuadrada igual que la de día, se asoma por el iris.
      .set(lamina, { x: () => m?.xPuerta ?? 0, y: 0, scale: () => elige(PUERTA, escritorio.matches).escala }, t5 + 0.14)
      .set(iris, { visibility: "visible" }, t5 + 0.15)
      .fromTo(abre, { p: 0 }, { p: 1, ease: "power2.in", duration: 0.3, immediateRender: false, onUpdate: pintaIris }, t5 + 0.15)
      // El día se apaga cuando la noche ya lo tapa entero, no antes (scripts/r1-velo.mjs).
      .set(planoDia, { opacity: 0 }, t5 + 0.46)
      // La cámara se aleja al plano de las 19:00: el celular y Moli abajo, arriba lugar para las cifras.
      .to(lamina, { scale: () => p19.escala, x: () => p19.x, y: () => p19.y, ease: "power2.inOut", duration: 0.2 }, t5 + 0.47)
      .to(capaRotulos, { opacity: 1, duration: 0.1 }, t5 + 0.6);

    // Cada cifra entra por la derecha desde la mitad del camino a su pausa, se asienta en ella y sale por
    // la izquierda hasta la mitad del camino a la siguiente: una por una, nunca dos a la vez.
    PAUSAS_CIFRAS.forEach((k, i) => {
      const antes = (PAUSAS[k - 1] + PAUSAS[k]) / 2;
      tl.fromTo(cifras[i], { xPercent: 105 }, { xPercent: 0, ease: "power2.out", duration: PAUSAS[k] - antes }, antes);
      if (k + 1 < PAUSAS.length) {
        const despues = (PAUSAS[k] + PAUSAS[k + 1]) / 2;
        tl.to(cifras[i], { xPercent: -105, ease: "power2.in", duration: despues - PAUSAS[k] }, PAUSAS[k]);
      }
    });
  }

  /* ── Reposo: lo que se ve quieto en cada pausa ── */
  /**
   * Antes de las 19:00 el reposo es el del CSS (`.cine` en anochecer.css): la luz apagada y Moli de la
   * noche escondido. Al arrancar no se toca nada.
   */
  let ultimo = 15;
  let diademaMovida = false;
  function estado(pausa: number) {
    const k = Math.min(Math.max(pausa, 15), 20);
    if (k === ultimo) return;
    ultimo = k;
    const sefue = k >= 16;
    // El plano general de día: desde P16 Ana ya se fue y el letrero dice CERRADO. Antes de las 09:00 el
    // reposo de esas piezas es el de la mañana (manana.ts): aquí no se toca.
    if (sefue || pausa >= 7) {
      anaQuieta(anaG, MIRA.moli);
      gsap.set(anaG.el, { xPercent: sefue ? -150 : 0, autoAlpha: sefue ? 0 : 1 });
      gsap.set(letrero, { scaleX: 1, rotation: 0 });
      gsap.set(cerrado, { autoAlpha: sefue ? 1 : 0 });
      gsap.set(abierto, { autoAlpha: sefue ? 0 : 1 });
      moliD.quieto("normal");
    }
    // La noche: desde P17 la luz del celular está prendida y Moli, de guardia.
    const guardia = k >= 17;
    gsap.set(luz, { opacity: guardia ? 1 : 0 });
    gsap.set(moliN.el, { autoAlpha: guardia ? 1 : 0 });
    // La diadema solo se toca si una actuación la movió (tocar un SVG con GSAP obliga a medirlo).
    if (diademaMovida) {
      gsap.set(diadema, { x: 0, y: 0 });
      diademaMovida = false;
    }
    moliN.quieto("normal");
  }

  /* ── Actuaciones ── */
  const actos: Record<number, (tl: gsap.core.Timeline) => void> = {
    // P16: Ana se despide de Moli con la mano, voltea el letrero a CERRADO y se va por la orilla. La pausa
    // cambia a media T4: la actuación espera a que la cámara llegue a la puerta.
    16: (tl) => {
      const a = gsap.timeline();
      // Se despide con la mano libre (la otra queda detrás de Moli) y con esa misma voltea el letrero.
      a.to(anaG.ojos, { ...MIRA.moli, duration: 0.2 }, 0);
      a.to(anaG.izq, { rotation: 150, svgOrigin: HOMBROS.izq, duration: 0.32, ease: "power2.out" }, 0.1);
      a.to(anaG.izq, { rotation: 124, svgOrigin: HOMBROS.izq, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.42);
      // Moli le contesta con un salto y un guiño.
      a.call(() => moliD.cara("feliz"), undefined, 0.3);
      moliD.salto(a, 0.35);
      a.call(() => moliD.cara("guino"), undefined, 1.05);
      // El letrero, como en la mañana pero al revés.
      a.to(anaG.ojos, { ...MIRA.celular, duration: 0.2 }, 1.05);
      a.to(letrero, { scaleX: 0, duration: 0.13, ease: "power2.in" }, 1.2);
      a.set(abierto, { autoAlpha: 0 }, 1.33).set(cerrado, { autoAlpha: 1 }, 1.33);
      a.to(letrero, { scaleX: 1, duration: 0.24, ease: "back.out(2)" }, 1.33);
      a.fromTo(letrero, { rotation: 0 }, { rotation: 6, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.45);
      a.to(anaG.izq, { rotation: 0, svgOrigin: HOMBROS.izq, duration: 0.4, ease: "power2.inOut" }, 1.75);
      // Y se va por la orilla del dibujo, por donde llegó.
      camina(a, anaG, 2.05, 1.1, { xPercent: -150 });
      a.to(anaG.el, { autoAlpha: 0, duration: 0.2 }, 2.95);
      a.call(() => moliD.cara("normal"), undefined, 2.8);
      tl.add(a, 0.5);
    },
    // P17: el celular enciende su luz a parpadeos; Moli se acomoda la diadema, da su salto de estirón y
    // aplastón y se queda de guardia, con los ojos abiertos. La pausa cambia a media noche: la actuación
    // espera a que la cámara termine de alejarse.
    17: (tl) => {
      const a = gsap.timeline();
      [0.65, 0.1, 0.9, 0.4, 1].forEach((o, i) => a.set(luz, { opacity: o }, [0, 0.14, 0.24, 0.38, 0.5][i]));
      a.set(moliN.el, { autoAlpha: 1 }, 0.24);
      a.call(() => moliN.cara("sorpresa"), undefined, 0.6);
      // La diadema: la sube, la acomoda de lado a lado y la deja caer en su lugar.
      a.call(() => void (diademaMovida = true), undefined, 0.8);
      a.to(diadema, { y: -26, duration: 0.2, ease: "power2.out" }, 0.8);
      a.call(() => moliN.cara("concentra"), undefined, 0.85);
      a.to(diadema, { x: 7, duration: 0.09, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.0);
      a.to(diadema, { y: 0, duration: 0.42, ease: "bounce.out" }, 1.36);
      a.call(() => moliN.cara("feliz"), undefined, 1.85);
      moliN.salto(a, 1.9);
      a.call(() => moliN.cara("normal"), undefined, 2.7);
      tl.add(a, 0.8);
    },
    // P18 a P20: las cifras las mueve la cámara; Moli sigue de guardia.
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

  /** El Moli que está a cuadro (para la línea viva): el de día en P16 y el de guardia desde P17. */
  const moliEn = (k: number): Titere | null | undefined => (k === 16 ? moliD : k >= 17 ? moliN : undefined);
  const reponer = () => {
    ultimo = -1;
  };

  return { camara, estado, entradas, moliEn, reponer };
}
