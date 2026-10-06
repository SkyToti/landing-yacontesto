/**
 * El reloj del scroll: cuánto mide la escena y dónde se asienta cada pausa, en pantallas de scroll.
 * Los mismos números viven en scripts/r1-escena.mjs y en `.cine .noche` (alto = PANTALLAS + 1).
 *
 * P0–P6: las 23:47 (la noche) · T1: el calendario se arranca · P7–P9: las 09:00.
 */
export const PANTALLAS = 6.9;
export const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5, 5.3, 6.0, 6.65];

/** Lo que pasa entre P6 y P7, atado al pulgar (la cámara). */
export const T1 = {
  /** El día aparece debajo y la hoja de la noche empieza a desprenderse por arriba. */
  inicio: 4.6,
  /** La orilla de la hoja ya pasó la cabecera: la marca y la pastilla se invierten. */
  amanece: 4.72,
};
