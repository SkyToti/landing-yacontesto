import { gsap } from "gsap";
import { rasgos, type Boca, type Cara } from "./partes";

/**
 * Moli como títere para el director: cambia de cara por piezas, salta, habla por cuadros y deja
 * salir la onda del micrófono. Cada Moli de la escena (noche, primer plano, día) es uno de estos.
 */
export type Titere = ReturnType<typeof crearMoli>;

export function crearMoli(el: HTMLElement, prefijo: string, inicial: Cara) {
  const g = el.querySelector<SVGGElement>(".rasgos-cine")!;
  const onda = el.querySelector<HTMLElement>(".moli-onda")!;
  const ruido = el.querySelector<SVGFETurbulenceElement>("feTurbulence")!;
  let cara = inicial;
  const pintar = (c: Cara, boca?: Boca) => {
    g.innerHTML = rasgos(prefijo, c, boca);
  };
  const ondear = (tl: gsap.core.Timeline, t: number) =>
    tl.fromTo(onda, { scale: 0.25, autoAlpha: 1 }, { scale: 1.9, autoAlpha: 0, duration: 0.65, ease: "power2.out" }, t);
  return {
    el,
    ruido,
    ondear,
    /** Cambia de cara solo si es otra (cada cambio redibuja la cara, no a Moli). */
    cara(c: Cara) {
      if (c === cara) return;
      cara = c;
      pintar(c);
    },
    /** Salto de caricatura: anticipa, se estira, aterriza y rebota. Solo `transform`. */
    salto(tl: gsap.core.Timeline, t: number) {
      tl.to(el, { scaleY: 0.86, scaleX: 1.08, duration: 0.12, ease: "power2.out" }, t)
        .to(el, { scaleY: 1.1, scaleX: 0.94, yPercent: -13, duration: 0.16, ease: "power2.out" })
        .to(el, { scaleY: 0.94, scaleX: 1.05, yPercent: 0, duration: 0.14, ease: "power2.in" })
        .to(el, { scaleY: 1, scaleX: 1, duration: 0.55, ease: "elastic.out(1, 0.4)" });
    },
    /**
     * Se va a saltitos: brincos cortos que avanzan `hasta` (en % de su ancho) y lo sacan de cuadro.
     * Cada brinco aplasta, despega y cae; el avance va parejo debajo. Solo `transform`.
     */
    saltitos(tl: gsap.core.Timeline, t: number, hasta: number, brincos = 4) {
      const d = 0.3;
      tl.to(el, { xPercent: hasta, duration: brincos * d, ease: "none" }, t);
      for (let i = 0; i < brincos; i++) {
        const s = t + i * d;
        tl.to(el, { yPercent: -9, scaleY: 1.06, scaleX: 0.96, duration: d * 0.45, ease: "power2.out" }, s).to(el, {
          yPercent: 0,
          scaleY: 0.92,
          scaleX: 1.05,
          duration: d * 0.55,
          ease: "power2.in",
        });
      }
      tl.to(el, { scaleY: 1, scaleX: 1, duration: 0.12 }, t + brincos * d);
    },
    /** Habla por cuadros (la boca cambia cada 0.11 s) y del micrófono sale la onda. */
    habla(tl: gsap.core.Timeline, t: number, final: Cara, cuadros = 7) {
      const bocas: Boca[] = ["abierta", "o", "linea", "abierta", "sonrisa", "o"];
      for (let i = 0; i < cuadros; i++) tl.call(() => pintar("normal", bocas[i % bocas.length]), undefined, t + i * 0.11);
      tl.call(() => ((cara = final), pintar(final)), undefined, t + cuadros * 0.11);
      ondear(tl, t + 0.05);
    },
    /** Quita lo que haya quedado a medias de una actuación. */
    quieto(c: Cara) {
      gsap.set(el, { scaleX: 1, scaleY: 1, yPercent: 0 });
      gsap.set(onda, { autoAlpha: 0 });
      cara = c;
      pintar(c);
    },
  };
}
