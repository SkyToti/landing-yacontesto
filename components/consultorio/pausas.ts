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
 * Lo que pasa entre P9 y P10, atado al pulgar: la cámara no sale del primer plano. Corta del celular de
 * las 09:00 al de las 11:20, que está en el mismo lugar: el mismo celular, otra hora y otro paciente.
 * Antes se alejaba hasta el mostrador y medio segundo después volvía a otro chat casi igual: un zoom de
 * ida y vuelta sin motivo (lo vio Diego el 7-oct; paso 8 del guion). Debajo, sin verse, el plano general
 * se acomoda en el celular de la clínica para que la T3 arranque desde ahí, y el reloj llega a las 11:20.
 * La pausa cambia a la mitad (7.05): la actuación de P10 espera a que el primer plano ya esté.
 */
export const T2 = {
  /** Se apartan los rótulos y, sin verse, el plano general empieza a moverse. */
  inicio: 6.72,
  /** Corte al primer plano de las 11:20. */
  corte: 7.0,
  /** El plano general, sin verse, ya empuja hacia el celular de la clínica. */
  llega: 7.14,
};

/**
 * Lo que pasa entre P12 y P13, atado al pulgar: el título se va, corte a la toma abierta de la clínica
 * entera (la recepción y el consultorio; dia/encuadres.ts) y ahí gira el reloj de 11:20 a 16:05; luego la
 * cámara se acerca al doctor, que atiende en el sillón, y corta al primer plano de las 16:05. La pausa
 * cambia a la mitad (9.2): la actuación de P13 espera. Antes del 9-oct el corte caía en el plano general
 * todavía empujado hacia el celular (un Moli gigante con el título encima) y la cámara cruzaba al
 * consultorio en un instante: Diego lo vio como un error.
 */
export const T3 = {
  /** Corte del primer plano de las 11:20 a la toma abierta (el título ya se fue). */
  inicio: 8.8,
  /** La cámara empieza a acercarse al doctor. */
  empuja: 9.0,
  /** Entra el primer plano de las 16:05. */
  llega: 9.32,
};

/**
 * Lo que pasa entre P15 y P16, atado al pulgar: el título se va, corte a la misma toma abierta y ahí el
 * reloj gira de 16:05 a 19:00; luego la cámara se acerca a la recepción entera, donde Ana se despide (más
 * abierta que antes: Diego, 9-oct). La pausa cambia a la mitad (11.375): la actuación de P16 espera.
 */
export const T4 = {
  /** Corte del primer plano de las 16:05 a la toma abierta (el título ya se fue). */
  inicio: 11.05,
  /** La cámara empieza a acercarse a la recepción. */
  empuja: 11.24,
  /** La cámara llega a la recepción. */
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

/**
 * Las pausas a las que se llega con un movimiento de cámara (T1, T3, T4 y T5; la T2 es un corte): en el
 * celular el paso a paso las recorre despacio, y en escritorio el imán termina la transición hacia donde
 * iba el scroll, sin ida y vuelta (Diego, 9-oct: «pasa muy rápido»).
 */
export const PAUSAS_CON_CAMARA = [7, 13, 16, 17];
