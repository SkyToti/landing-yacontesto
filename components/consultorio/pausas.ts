/**
 * El reloj del scroll: cuánto mide la escena y dónde se asienta cada pausa, en pantallas de scroll.
 * Los mismos números viven en scripts/r1-escena.mjs y en `.cine .noche` (alto = PANTALLAS + 1).
 *
 * P0–P6: las 23:47 (la noche) · T1: el calendario se arranca · P7–P9: las 09:00 ·
 * T2: la cámara se desliza por el mostrador · P10–P12: las 11:20 · T3: el reloj gira y la cámara va
 * al consultorio · P13–P15: las 16:05 · T4: el reloj llega a 19:00 y la cámara vuelve a la ventana ·
 * P16: Ana se va · T5: la noche entra por la ventana · P17–P20: las 19:00 (la luz del celular, Moli de
 * guardia y las tres cifras, una por pausa).
 */
export const PANTALLAS = 14.75;
export const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5, 5.3, 6.0, 6.65, 7.45, 8.1, 8.75, 9.65, 10.3, 11.0, 11.75, 12.7, 13.3, 13.9, 14.5];

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

/**
 * Lo que pasa entre P12 y P13, atado al pulgar: la cámara se aleja del celular, el reloj gira de 11:20 a
 * 16:05 y la cámara se va a la derecha, al consultorio, donde el doctor atiende en el sillón. Luego
 * corta al primer plano de las 16:05. La pausa cambia a la mitad (9.2): la actuación de P13 espera.
 */
export const T3 = {
  /** El primer plano de las 11:20 se aleja y vuelve el plano general, en el mostrador. */
  inicio: 8.82,
  /** La cámara llega al consultorio. */
  consultorio: 9.12,
  /** Entra el primer plano de las 16:05. */
  llega: 9.32,
};

/**
 * Lo que pasa entre P15 y P16, atado al pulgar: el primer plano de las 16:05 se aleja, la cámara vuelve
 * del consultorio a la ventana mientras el reloj gira de 16:05 a 19:00, y se queda en la puerta, donde
 * Ana se despide. La pausa cambia a la mitad (11.375): la actuación de P16 espera a la cámara.
 */
export const T4 = {
  /** El primer plano de las 16:05 se aleja y vuelve el plano general, en el consultorio. */
  inicio: 11.07,
  /** La cámara llega a la ventana. */
  llega: 11.5,
};

/**
 * Lo que pasa entre P16 y P17, atado al pulgar: el sol se mete y sale la luna en la ventana, la noche
 * entra por ella como un iris que se abre hasta tapar la pantalla y la cámara se aleja al plano de las
 * 19:00 (el celular y Moli abajo; arriba, lugar para las cifras). La pausa cambia a media noche (12.225).
 */
export const T5 = {
  /** El sol empieza a meterse. */
  inicio: 11.85,
  /** La noche ya tapó la cabecera y la pastilla: la marca y la pastilla vuelven a la noche. */
  anochece: 12.27,
};

/** Las pausas de las tres cifras de las 19:00: «7 días», «14 días» y «tu mismo número». */
export const PAUSAS_CIFRAS = [18, 19, 20];
