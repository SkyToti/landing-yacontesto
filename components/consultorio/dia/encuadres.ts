/**
 * Los encuadres del plano general de día que comparten la T3 y la T4 (Diego, 9-oct-2026: el cruce al
 * consultorio «se ve muy raro» y «estaría chido la toma un poquito más alejada»). Cada uno dice qué unidad
 * del lienzo (480 de ancho la recepción; el consultorio sigue a la derecha, de 480 a 900) queda en qué
 * lugar de la pantalla (fracción del ancho del escenario) y con qué escala respecto a la lámina sin cámara.
 * Se eligieron mirando candidatos en 390 × 664 y 1920 × 950.
 * - CLINICA: la toma abierta de las dos piezas, la recepción y el consultorio. Ahí gira el reloj. Sube un
 *   12 % de la pantalla (`alto`): sin el título, abierta, quedaba baja y en escritorio se cortaba el piso.
 * - CONSULTORIO: la cámara se acerca al doctor, que atiende con las manos ocupadas (T3).
 * - PUERTA: la recepción entera a las 19:00, donde Ana se despide (P16); en escritorio, a la derecha del
 *   rótulo. Antes era 1.35 sobre la ventana: Moli quedaba cortado y la toma, apretada.
 */
export type Encuadre = { u: number; escala: number; ancla: number; alto: number };
type PorPantalla = { celular: Encuadre; escritorio: Encuadre };

export const CLINICA: PorPantalla = {
  celular: { u: 410, escala: 0.75, ancla: 0.5, alto: -0.12 },
  escritorio: { u: 430, escala: 0.7, ancla: 0.5, alto: -0.12 },
};
export const CONSULTORIO: PorPantalla = {
  celular: { u: 630, escala: 0.9, ancla: 0.5, alto: 0 },
  escritorio: { u: 580, escala: 1.05, ancla: 0.5, alto: 0 },
};
export const PUERTA: PorPantalla = {
  celular: { u: 240, escala: 1, ancla: 0.5, alto: 0 },
  escritorio: { u: 240, escala: 1, ancla: 0.62, alto: 0 },
};

export const LIENZO_ANCHO = 480;

export const elige = (e: PorPantalla, escritorio: boolean) => (escritorio ? e.escritorio : e.celular);

/** Cuánto sube (negativo) o baja la lámina en px con ese encuadre. */
export const yPara = (escenario: HTMLElement, e: Encuadre) => e.alto * escenario.clientHeight;

/**
 * Dónde tiene que quedar en pantalla el origen de la lámina (su transform-origin, que no se mueve al
 * escalar) para que la unidad `u` caiga en el ancla con esa escala. Con la cámara puesta, hoy está en
 * r.left + o·s (r: su caja en pantalla; s: su escala): la diferencia es lo que se mueve en x.
 */
export function origenPara(lamina: HTMLElement, escenario: HTMLElement, e: Encuadre) {
  const esc = escenario.getBoundingClientRect();
  const o = parseFloat(getComputedStyle(lamina).transformOrigin);
  const k = lamina.offsetWidth / LIENZO_ANCHO;
  return esc.left + e.ancla * esc.width - (e.u * k - o) * e.escala;
}

/** Dónde está hoy en pantalla el origen de la lámina. */
export function origenActual(lamina: HTMLElement, escala: number) {
  const r = lamina.getBoundingClientRect();
  const o = parseFloat(getComputedStyle(lamina).transformOrigin);
  return r.left + o * escala;
}
