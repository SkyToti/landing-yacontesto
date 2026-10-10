import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PANTALLAS, PAUSAS, PAUSAS_CON_CAMARA } from "../pausas";

/**
 * Paso a paso en pantallas táctiles (Diego, 9-oct-2026: «le dan scroll súper rápido y se pasan toda la
 * landing»). Con la inercia del celular un deslizón rápido recorre varias pantallas, y la historia pone una
 * pausa cada 0.7: desde la portada caía en P9 (scripts/r1-paso.mjs, con la inercia de iOS simulada).
 * Aquí, dentro de la historia, cada deslizón avanza o regresa UNA pausa a su ritmo, sin importar la fuerza,
 * como los Estados de WhatsApp: ~0.7 s una pausa común y 2.4 s las que llevan movimiento de cámara.
 * - El dedo no mueve la página: la clase «paso» pone `touch-action: pinch-zoom` (noche.css) y el touchmove
 *   de un dedo se cancela. El pellizco para acercar y los toques (la pastilla, los enlaces) siguen.
 * - Un gesto = un paso, y arranca al soltar el dedo. Gestos seguidos sí se encadenan.
 * - Después de P20, el siguiente deslizón lleva a «Así lo instalamos» y de ahí el scroll es el de siempre.
 *   Al volver a la historia con el scroll, el paso a paso se prende otra vez y el imán del director asienta
 *   la pausa.
 * - Red de seguridad: si un paso no mueve la página en 0.6 s, el paso a paso se apaga y vuelve el scroll
 *   de siempre. Nadie se queda atorado.
 * - Solo con puntero grueso (celular y tableta) y fuera de iPhone y iPad: el 10-oct Diego vio que en su
 *   iPhone la página no se movía (el scroll de siempre quedaba frenado y el paso no avanzaba), mientras en
 *   Android sí funcionaba; en el WebKit de Windows no se reproduce. Ahí va el scroll de siempre hasta
 *   probarlo en un iPhone: `?paso=1` lo fuerza y `?depura=1` enseña en pantalla qué pasa con cada toque.
 * - Sin «cine» (movimiento reducido, sin JavaScript) el director ni arranca.
 */
export function armarPasoAPaso(st: ScrollTrigger): () => void {
  const parametros = new URLSearchParams(location.search);
  const forzado = parametros.get("paso") === "1";
  const depura = parametros.get("depura") === "1";
  // iPadOS se presenta como Mac: se reconoce por la pantalla táctil.
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const anota = registro(depura);
  anota(`armado · ios ${ios} · forzado ${forzado} · grueso ${matchMedia("(pointer: coarse)").matches}`);
  if (!matchMedia("(pointer: coarse)").matches || (ios && !forzado)) return () => {};

  const html = document.documentElement;
  const raiz = st.trigger as HTMLElement;
  const paradas = PAUSAS.map((p) => p / PANTALLAS);
  // ScrollTrigger calcula sus posiciones un instante después de crearse (al armarse, `end` vale undefined):
  // mientras tanto salen de la escena misma, que empieza arriba de la página.
  const inicio = () => (Number.isFinite(st.end) ? st.start : raiz.offsetTop);
  const fin = () => (Number.isFinite(st.end) ? st.end : raiz.offsetTop + raiz.offsetHeight - innerHeight);
  const yDe = (k: number) => inicio() + paradas[k] * (fin() - inicio());
  /** La pausa más cercana a donde está el scroll. */
  const cercana = () => {
    let k = 0;
    paradas.forEach((_, i) => {
      if (Math.abs(yDe(i) - scrollY) < Math.abs(yDe(k) - scrollY)) k = i;
    });
    return k;
  };
  /** Al salir: «Así lo instalamos» bajo la cabecera. */
  const ySalida = () => {
    const seccion = document.getElementById("instalacion");
    return seccion ? seccion.getBoundingClientRect().top + scrollY - 64 : fin() + innerHeight;
  };

  // Más distancia, más tiempo: una pausa común (0.65 pantallas) dura ~0.66 s.
  const duracion = (pixeles: number) => gsap.utils.clamp(0.5, 1.1, 0.3 + (0.55 * Math.abs(pixeles)) / innerHeight);
  /**
   * Un tramo con movimiento de cámara (T1, T3, T4 y T5) va despacio: a ~0.7 s por paso la T3 cruzaba al
   * consultorio en un cuarto de segundo (grabado el 9-oct; Diego: «pasa muy rápido»). El tiempo de un viaje
   * es la suma de lo que recorre de cada tramo: si se encadena un deslizón a media transición, lo que queda
   * de la cámara sigue yendo despacio.
   */
  const DURACION_CAMARA = 2.4;
  function tiempoDe(y0: number, y1: number) {
    const lo = Math.min(y0, y1);
    const hi = Math.max(y0, y1);
    let total = 0;
    let camara = false;
    for (let g = 1; g < paradas.length; g++) {
      const a = yDe(g - 1);
      const b = yDe(g);
      const parte = Math.max(0, Math.min(hi, b) - Math.max(lo, a)) / (b - a);
      if (parte <= 0) continue;
      const conCamara = PAUSAS_CON_CAMARA.includes(g);
      camara ||= conCamara && parte > 0.15;
      total += parte * (conCamara ? DURACION_CAMARA : duracion(b - a));
    }
    // La salida a lo de después, más allá de P20.
    const ultima = yDe(paradas.length - 1);
    if (hi > ultima) total += duracion(hi - Math.max(lo, ultima));
    return { duracion: gsap.utils.clamp(0.5, 3.6, total), camara };
  }

  let roto = false;
  let destino = -1;
  let viaje: gsap.core.Tween | null = null;
  let vigia = 0;
  function viajaA(y: number) {
    viaje?.kill();
    // Si el imán del director todavía estaba asentando la pausa anterior, se le gana: dos tweens moviendo
    // el scroll se pelean y el paso nuevo se perdería.
    const iman = st.getTween(true);
    if (iman) iman.kill();
    const desde = scrollY;
    const lleva = { y: desde };
    // Lo último que se le pidió a la página. Si un cuadro después está a más de 60 px, otra cosa la movió (un
    // enlace como «Precio») y se le cede el control. Con 3 px, un navegador que aplica el scroll con un
    // cuadro de retraso cortaba el viaje en el primer cuadro.
    let pedido = desde;
    let cuadros = 0;
    const { duracion: segundos, camara } = tiempoDe(desde, y);
    anota(`viaje ${Math.round(desde)} → ${Math.round(y)} en ${segundos.toFixed(2)} s`);
    viaje = gsap.to(lleva, {
      y,
      duration: segundos,
      // Con cámara, parejo: cada movimiento de cámara ya trae su propia curva, y con una curva aquí el
      // acercamiento caía en lo más rápido del paso (~0.3 s, grabado el 9-oct).
      ease: camara ? "none" : "power2.inOut",
      onUpdate: () => {
        if (Math.abs(scrollY - pedido) > 60) {
          anota(`otra cosa movió la página: ${Math.round(scrollY)} contra ${Math.round(pedido)}`);
          viaje?.kill();
          viaje = null;
          destino = -1;
          return;
        }
        pedido = lleva.y;
        window.scrollTo(0, pedido);
        if (++cuadros <= 3) anota(`cuadro ${cuadros}: pedí ${Math.round(pedido)}, quedó ${Math.round(scrollY)}`);
      },
      onComplete: () => {
        anota(`llegó: ${Math.round(scrollY)}`);
        viaje = null;
        destino = -1;
      },
    });
    // La red de seguridad: si en 0.6 s la página no se movió, en este navegador el paso a paso no sirve y
    // se apaga (vuelve el scroll de siempre).
    window.clearTimeout(vigia);
    if (Math.abs(y - desde) >= 30) {
      vigia = window.setTimeout(() => {
        const movio = Math.abs(scrollY - desde);
        anota(`vigía: se movió ${Math.round(movio)} px`);
        if (movio < 8) apaga("un paso no movió la página");
      }, 600);
    }
  }

  function avanza(direccion: 1 | -1) {
    const desde = viaje && destino >= 0 ? destino : cercana();
    const k = desde + direccion;
    anota(`paso ${direccion > 0 ? "adelante" : "atrás"}: P${desde} → ${k >= paradas.length ? "después" : `P${k}`}`);
    if (k < 0) return;
    if (k >= paradas.length) {
      destino = -1;
      viajaA(ySalida());
      return;
    }
    destino = k;
    viajaA(yDe(k));
  }

  /* ── El dedo: un gesto = un paso, al soltar ── */
  const TOLERANCIA = 10;
  let x0 = 0;
  let y0 = 0;
  let rumbo: -1 | 0 | 1 = 0;
  let ignora = false;
  let movidas = 0;
  const alTocar = (e: TouchEvent) => {
    ignora = e.touches.length > 1 || !html.classList.contains("paso");
    rumbo = 0;
    movidas = 0;
    const t = e.touches[0];
    if (t) {
      x0 = t.clientX;
      y0 = t.clientY;
    }
    anota(`toque · dedos ${e.touches.length} · en la historia ${html.classList.contains("paso")}`);
  };
  // Solo mientras se está en la historia: un escucha de touchmove que puede cancelar hace que el navegador
  // espere al JavaScript antes de mover la página, y en lo de después eso se sentiría trabado.
  const alMover = (e: TouchEvent) => {
    // Dos dedos: es un pellizco para acercar; no se frena ni cuenta.
    if (e.touches.length > 1) {
      ignora = true;
      return;
    }
    if (e.cancelable) e.preventDefault();
    if (++movidas === 1) anota(`mueve · se puede cancelar ${e.cancelable} · cancelado ${e.defaultPrevented}`);
    if (ignora || rumbo) return;
    const t = e.touches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    if (Math.abs(dy) < TOLERANCIA || Math.abs(dy) <= Math.abs(dx)) return;
    // El dedo sube: la historia avanza (como el scroll de siempre).
    rumbo = dy < 0 ? 1 : -1;
  };
  const alSoltar = () => {
    anota(`suelta · rumbo ${rumbo} · movidas ${movidas}`);
    if (!ignora && rumbo && !roto) avanza(rumbo);
    rumbo = 0;
  };
  const alCancelar = () => {
    anota("toque cancelado por el sistema");
    rumbo = 0;
  };

  // Prendido mientras el scroll está en la historia (de la portada al final de la escena fija).
  const dentro = () => {
    if (roto) return;
    const si = scrollY <= fin() + 1;
    if (si === html.classList.contains("paso")) return;
    html.classList.toggle("paso", si);
    if (si) addEventListener("touchmove", alMover, { passive: false });
    else removeEventListener("touchmove", alMover);
  };
  dentro();
  addEventListener("scroll", dentro, { passive: true });
  // Al girar el celular o cambiar el tamaño, la escena mide otra cosa.
  ScrollTrigger.addEventListener("refresh", dentro);
  addEventListener("touchstart", alTocar, { passive: true });
  addEventListener("touchend", alSoltar, { passive: true });
  addEventListener("touchcancel", alCancelar, { passive: true });
  anota(`listo · touch-action ${getComputedStyle(html).touchAction}`);

  function apaga(motivo: string) {
    roto = true;
    anota(`APAGADO: ${motivo}`);
    viaje?.kill();
    viaje = null;
    window.clearTimeout(vigia);
    removeEventListener("touchmove", alMover);
    html.classList.remove("paso");
  }

  return () => {
    apaga("se desarmó la escena");
    removeEventListener("scroll", dentro);
    removeEventListener("touchstart", alTocar);
    removeEventListener("touchend", alSoltar);
    removeEventListener("touchcancel", alCancelar);
    ScrollTrigger.removeEventListener("refresh", dentro);
  };
}

/**
 * Con `?depura=1`, una caja arriba de la pantalla con lo último que pasó (toques, pasos, viajes y la red de
 * seguridad), para diagnosticar en un celular de verdad con una captura. Sin el parámetro no hace nada.
 */
function registro(prendido: boolean): (texto: string) => void {
  if (!prendido) return () => {};
  const caja = document.createElement("div");
  caja.setAttribute("aria-hidden", "true");
  Object.assign(caja.style, {
    position: "fixed",
    left: "6px",
    right: "6px",
    top: "56px",
    zIndex: "100",
    padding: "6px 8px",
    borderRadius: "8px",
    background: "rgba(0, 0, 0, 0.8)",
    color: "#ABFF84",
    font: "11px/1.35 ui-monospace, Menlo, monospace",
    whiteSpace: "pre-wrap",
    pointerEvents: "none",
  });
  document.body.append(caja);
  const lineas: string[] = [];
  return (texto: string) => {
    lineas.push(`${(performance.now() / 1000).toFixed(2)} ${texto}`);
    if (lineas.length > 16) lineas.shift();
    caja.textContent = lineas.join("\n");
  };
}
