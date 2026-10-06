/**
 * El reloj del scroll: cuánto mide la escena y dónde se asienta cada pausa, en pantallas de scroll.
 * Los mismos números viven en scripts/r1-escena.mjs y en `.cine .noche` (alto = PANTALLAS + 1).
 *
 * P0–P6: las 23:47 (la noche) · T1: el calendario se arranca · P7–P9: las 09:00 ·
 * T2: la cámara se desliza por el mostrador · P10–P12: las 11:20.
 */
export const PANTALLAS = 9.0;
export const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5, 5.3, 6.0, 6.65, 7.45, 8.1, 8.75];

/** Lo que pasa entre P6 y P7, atado al pulgar (la cámara). */
export const T1 = {
  /** El día aparece debajo y la hoja de la noche empieza a desprenderse por arriba. */
  inicio: 4.6,
  /** La orilla de la hoja ya pasó la cabecera: la marca y la pastilla se invierten. */
  amanece: 4.72,
};

/**
 * Lo que pasa entre P9 y P10, atado al pulgar: la cámara se aleja del celular, se desliza por el
 * mostrador mientras el reloj gira de 09:00 a 11:20 y entra al primer plano de las 11:20.
 * La pausa cambia a la mitad (7.05): la actuación de P10 espera a que el primer plano ya esté.
 */
export const T2 = {
  /** El primer plano de las 09:00 se aleja y vuelve el plano general, cerca del mostrador. */
  inicio: 6.72,
  /** Entra el primer plano de las 11:20. */
  llega: 7.14,
};
