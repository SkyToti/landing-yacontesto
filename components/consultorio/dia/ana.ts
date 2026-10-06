import { gsap } from "gsap";

/**
 * Ana como títere, compartido por los actos de día (las 09:00 y las 11:20): el cuerpo entero (HTML),
 * los ojos y los brazos (SVG, giran en el hombro: `HOMBROS` en dibujo.ts).
 */
export function crearAna(el: HTMLElement) {
  return {
    el,
    ojos: el.querySelector<SVGGElement>(".ana-ojos")!,
    izq: el.querySelector<SVGGElement>(".ana-brazo-izq")!,
    der: el.querySelector<SVGGElement>(".ana-brazo-der")!,
  };
}
export type Ana = ReturnType<typeof crearAna>;

/** Hacia dónde mira Ana. */
export const MIRA = {
  frente: { x: 0, y: 0 },
  moli: { x: 2.2, y: 0 },
  compu: { x: 1.8, y: -1.8 },
  celular: { x: -2.2, y: 0.6 },
  arriba: { x: 0.6, y: -2.4 },
};

/** Ana quieta: en su lugar, con los brazos abajo y la mirada donde se le diga. */
export function anaQuieta(a: Ana, mira: { x: number; y: number }) {
  gsap.set(a.el, { yPercent: 0 });
  // Los brazos vuelven a su lugar quitando el giro, sin svgOrigin: ese obliga a medir el SVG (getBBox)
  // y, al arrancar, alargaba la tarea de armar la escena unos 30 ms con la CPU 4× más lenta.
  gsap.set([a.izq, a.der], { clearProps: "transform" });
  gsap.set(a.ojos, mira);
}

/** Ana camina: el cuerpo avanza y la cabeza sube y baja a cada paso. */
export function camina(tl: gsap.core.Timeline, a: Ana, t: number, duracion: number, vars: gsap.TweenVars) {
  tl.to(a.el, { ...vars, duration: duracion, ease: "power1.inOut" }, t);
  const pasos = Math.max(2, Math.round(duracion / 0.15));
  tl.fromTo(a.el, { yPercent: 0 }, { yPercent: -2.2, duration: duracion / pasos, yoyo: true, repeat: pasos - 1 + (pasos % 2), ease: "sine.inOut" }, t);
}
