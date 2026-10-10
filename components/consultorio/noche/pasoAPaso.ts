import { gsap } from "gsap";
import type { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PANTALLAS, PAUSAS } from "../pausas";

/**
 * Paso a paso en pantallas táctiles (Diego, 9-oct-2026: «le dan scroll súper rápido y se pasan toda la
 * landing»). Con la inercia del celular un deslizón rápido recorre varias pantallas, y la historia pone una
 * pausa cada 0.7: desde la portada caía en P9 (scripts/r1-paso.mjs, con la inercia de iOS simulada).
 * Aquí, dentro de la historia, cada deslizón avanza o regresa UNA pausa a velocidad fija, sin importar la
 * fuerza, como los Estados de WhatsApp.
 * - El dedo no mueve la página: la clase «paso» pone `touch-action: pinch-zoom` (noche.css) y, de respaldo
 *   para Safari, el touchmove de un dedo se cancela. El pellizco para acercar y los toques (la pastilla, los
 *   enlaces) siguen funcionando.
 * - Un gesto = un paso. Gestos seguidos sí se encadenan: cada uno suma una pausa al destino.
 * - Después de P20, el siguiente deslizón lleva a «Así lo instalamos» y de ahí el scroll es el de siempre.
 *   Al volver a la historia con el scroll, el paso a paso se prende otra vez y el imán del director asienta
 *   la pausa.
 * - Solo con puntero grueso (celular y tableta): en escritorio no cambia nada. Sin «cine» (movimiento
 *   reducido, sin JavaScript) el director ni arranca.
 */
export function armarPasoAPaso(st: ScrollTrigger): () => void {
  if (!matchMedia("(pointer: coarse)").matches) return () => {};
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

  // Más distancia, más tiempo: una pausa común (0.65 pantallas) dura ~0.66 s y una transición (~0.95), ~0.82.
  const duracion = (pixeles: number) => gsap.utils.clamp(0.5, 1.1, 0.3 + (0.55 * Math.abs(pixeles)) / innerHeight);

  let destino = -1;
  let viaje: gsap.core.Tween | null = null;
  let puesto = 0;
  function viajaA(y: number) {
    viaje?.kill();
    // Si el imán del director todavía estaba asentando la pausa anterior, se le gana: dos tweens moviendo
    // el scroll se pelean y el paso nuevo se perdería.
    const iman = st.getTween(true);
    if (iman) iman.kill();
    const lleva = { y: scrollY };
    puesto = scrollY;
    viaje = gsap.to(lleva, {
      y,
      duration: duracion(y - scrollY),
      ease: "power2.inOut",
      onUpdate: () => {
        // Si algo más movió la página (un enlace como «Precio»), se le cede el control.
        if (Math.abs(scrollY - puesto) > 3) {
          viaje?.kill();
          viaje = null;
          destino = -1;
          return;
        }
        window.scrollTo(0, lleva.y);
        puesto = scrollY;
      },
      onComplete: () => {
        viaje = null;
        destino = -1;
      },
    });
  }

  function avanza(direccion: 1 | -1) {
    const desde = viaje && destino >= 0 ? destino : cercana();
    const k = desde + direccion;
    if (k < 0) return;
    if (k >= paradas.length) {
      destino = -1;
      viajaA(ySalida());
      return;
    }
    destino = k;
    viajaA(yDe(k));
  }

  // Respaldo del touch-action para Safari: un dedo que se mueve dentro de la historia no desplaza la página.
  // Solo mientras se está en la historia: un escucha de touchmove que puede cancelar hace que el navegador
  // espere al JavaScript antes de mover la página, y en lo de después eso se sentiría trabado.
  const frena = (e: TouchEvent) => {
    if (e.touches.length === 1 && e.cancelable) e.preventDefault();
  };

  // Prendido mientras el scroll está en la historia (de la portada al final de la escena fija).
  const dentro = () => {
    const si = scrollY <= fin() + 1;
    if (si === html.classList.contains("paso")) return;
    html.classList.toggle("paso", si);
    if (si) addEventListener("touchmove", frena, { passive: false });
    else removeEventListener("touchmove", frena);
  };
  dentro();
  addEventListener("scroll", dentro, { passive: true });
  // Al girar el celular o cambiar el tamaño, la escena mide otra cosa.
  ScrollTrigger.addEventListener("refresh", dentro);

  // Un gesto = un paso: cuenta el primero que pasa la tolerancia y el resto del mismo gesto no.
  let gastado = false;
  const dedos = (e: Event) => ("touches" in e ? (e as TouchEvent).touches.length : 1);
  const observador = ScrollTrigger.observe({
    target: window,
    type: "touch",
    tolerance: 10,
    lockAxis: true,
    onPress: (self) => {
      gastado = dedos(self.event) > 1;
    },
    // El dedo sube: la historia avanza (como el scroll de siempre).
    onUp: (self) => paso(self, 1),
    onDown: (self) => paso(self, -1),
  });
  function paso(self: Observer, direccion: 1 | -1) {
    if (gastado || !html.classList.contains("paso") || dedos(self.event) > 1) return;
    gastado = true;
    avanza(direccion);
  }

  return () => {
    observador.kill();
    viaje?.kill();
    removeEventListener("scroll", dentro);
    removeEventListener("touchmove", frena);
    ScrollTrigger.removeEventListener("refresh", dentro);
    html.classList.remove("paso");
  };
}
