/**
 * El mismo consultorio, de día (escena de las 09:00): papel crema con trazo de tinta, como la hoja de
 * Moli. Son las piezas de `noche/dibujo.ts`, pintadas en tinta, partidas en dos capas para que Ana
 * pase entre la pared y el mostrador:
 * - fondo: piso, ventana (sin luna), los cordones del letrero, el calendario en «15 · JUE» y el reloj
 *   sin manecillas;
 * - frente: el mostrador, el celular en su base y la computadora encendida, con la cita en verde.
 * Lo que se mueve va aparte, en capas propias: las manecillas, el cielo de la ventana (la luna que se
 * mete y el sol que sale), el letrero que se voltea y Ana.
 */
import { ENCENDIDO, calendario, compu, linea, mostrador, piso, reloj, telefono, ventana } from "../noche/dibujo";

const T = "#0E100F";
const C = "#FFFCE1";

/** Dónde quedan las piezas que se mueven, en unidades del lienzo de 480 × 900. */
export const PUNTOS_DIA = {
  /** El centro del reloj (el mismo de la noche). */
  reloj: { x: 392, y: 452, r: 40 },
  /** El vidrio de arriba a la derecha de la ventana: ahí estaba la luna. */
  cielo: { x: 104, y: 415, ancho: 71, alto: 69 },
  /** El letrero colgado del vidrio. */
  letrero: { x: 33, y: 503, ancho: 84, alto: 37 },
  /**
   * Ana detrás del mostrador: el centro de su cabeza y su escala (los monitos de la hoja son chicos;
   * junto a Moli, a 1.3 se lee como persona). La cadera queda al ras del mostrador y la maceta, enfrente.
   */
  ana: { x: 130, y: 540, escala: 1.3 },
  /** La computadora: hacia ahí empuja la cámara. */
  compu: { x: 403, y: 598 },
};

export function diaFondo() {
  return (
    piso(ENCENDIDO) +
    ventana(ENCENDIDO, false, "#FFFFFF") +
    linea("M52 488L60 506M96 488L88 506", T, 2.4) +
    calendario(ENCENDIDO, "15", "JUE") +
    reloj(ENCENDIDO, false)
  );
}

export function diaFrente() {
  return mostrador(ENCENDIDO) + telefono(ENCENDIDO) + compu(ENCENDIDO, true);
}

/**
 * Una manecilla, dibujada a las 12 en una caja del tamaño del reloj (80 × 80): el director la gira
 * entera, como capa, sin redibujar. La del minutero lleva el botón del centro.
 */
export function manecilla(tipo: "hora" | "minuto") {
  const largo = tipo === "hora" ? 17 : 25;
  const ancho = tipo === "hora" ? 6 : 4.5;
  return (
    linea(`M40 40V${40 - largo}`, T, ancho) + (tipo === "minuto" ? `<circle cx="40" cy="40" r="4" fill="${T}"/>` : "")
  );
}

/** La luna de la noche, ahora de día y con trazo: se mete por abajo del vidrio. Caja 71 × 69. */
export function luna() {
  return `<path d="M47 9C34 9 24 20 25 33C26 46 37 55 50 54C43 50 38 42 38 32C38 22 42 14 47 9Z" fill="${C}" stroke="${T}" stroke-width="2.6" stroke-linejoin="round"/>`;
}

/** El sol, que sale en el mismo vidrio: círculo y ocho rayos de marcador. Caja 71 × 69. */
export function sol() {
  const rayos = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + 0.2;
    const p = (r: number) => `${(36 + Math.cos(a) * r).toFixed(1)} ${(34 + Math.sin(a) * r).toFixed(1)}`;
    return `M${p(19)}L${p(26)}`;
  }).join("");
  return (
    `<path d="M36 21C44 21 49 27 49 34C49 42 43 47 36 47C28 47 23 41 23 34C23 26 29 21 36 21Z" fill="${C}" stroke="${T}" stroke-width="2.8"/>` +
    linea(rayos, T, 2.6)
  );
}

/** Una cara del letrero (caja 84 × 37): crema con letra de tinta, como la de la noche. */
export function caraLetrero(texto: "CERRADO" | "ABIERTO") {
  return (
    `<path d="M2 3Q43 0 83 4L81 34Q42 37 3 33Z" fill="${C}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>` +
    `<text x="42" y="25" text-anchor="middle" font-size="18" fill="${T}" style="font-family:var(--f-mano),cursive;letter-spacing:.06em">${texto}</text>`
  );
}

/**
 * Ana, la recepcionista: un monito de trazo fino (regla 7 de Adrien Lamy), con las proporciones de
 * los monitos de la hoja de Moli. Moli es el único con masas negras; Ana es pura línea: el chongo, el
 * vestido y el gafete la hacen persona (con brazos de palito sueltos, detrás del mostrador se leían
 * como piernas). El centro de la cabeza es (0, 0); caja: -50 -26 100 154. El dobladillo cae en y = 86:
 * en el plano general queda al ras del mostrador.
 * Grupos que mueve el director: `.ana-ojos` (mira), `.ana-brazo-izq` y `.ana-brazo-der` (giran en
 * cada hombro: HOMBROS).
 */
export const HOMBROS = { izq: "-8 22", der: "8 22" };
export const CAJA_ANA = "-50 -26 100 154";
export function ana() {
  const trazo = `fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  return `
    <g ${trazo}>
      <path d="M-7 88L-10 124M7 88L10 124"/>
      <g class="ana-brazo-izq"><path d="M-8 22L-19 62"/></g>
      <g class="ana-brazo-der"><path d="M8 22L19 62"/></g>
      <path d="M-9 17Q0 14 9 17L18 85Q0 89 -18 85Z" fill="${C}"/>
      <path d="M5 30V36M1 36H10V46H1Z" fill="${C}"/>
      <circle cx="-11" cy="-14" r="6.5" fill="${C}"/>
      <circle cx="0" cy="0" r="16" fill="${C}"/>
      <path d="M-14 -6Q-5 -17 13 -9"/>
      <path d="M-5 7Q0 11 5 7"/>
    </g>
    <g class="ana-ojos" fill="${T}"><circle cx="-5.5" cy="-1" r="1.9"/><circle cx="5.5" cy="-1" r="1.9"/></g>`;
}

/** La hoja del 14 hecha bolita, para que salga volando. Caja 0 0 80 80. */
export function bolita() {
  return (
    `<path d="M40 6C55 5 70 15 73 31C77 47 69 66 52 73C36 79 15 72 9 56C3 41 8 22 21 13C26 9 33 6 40 6Z" fill="${T}" stroke="#57584F" stroke-width="3" stroke-linejoin="round"/>` +
    linea("M22 24L36 33L30 48M36 33L55 27L60 44M30 48L47 55L60 44M47 55L44 70M18 50L30 48", "#57584F", 2.4)
  );
}
