/**
 * El consultorio de noche, dibujado con las reglas de Moli (trazo de marcador, puntas redondas,
 * ninguna curva perfecta). Lienzo de 480 × 900, pensado primero para el celular en vertical.
 *
 * Cada pieza se escribe UNA vez y se pinta dos veces, como en itomdev.com:
 * - apagada: trazo tenue sobre la noche, fuera de la luz;
 * - encendida: tinta sobre crema, recortada por la luz del celular.
 * Las piezas son sueltas para que algún día se puedan cambiar por dibujos hechos a mano.
 */

export const LIENZO = { ancho: 480, alto: 900 };

/** Dónde quedan las cosas, en unidades del lienzo (las usan el CSS y el director). */
export const PUNTOS = {
  telefono: { x: 323, y: 594 },
  /** Caja de Moli dormido sobre el mostrador. */
  moli: { x: 146, y: 500, ancho: 140 },
  luzGrande: { x: 318, y: 600, r: 196 },
  luzChica: { x: 222, y: 592, r: 112 },
  /**
   * El iris del cierre (P6): un círculo centrado en la luz chica que, abierto (r0), contiene toda la
   * luz grande (su punto más lejano queda a ~306) y se cierra hasta r1, apenas fuera de la luz chica.
   */
  iris: { x: 222, y: 592, r0: 320, r1: 118 },
};

type Estilo = { trazo: string; relleno: string; pantalla: string; burbujas: boolean };

const APAGADO: Estilo = { trazo: "#57584F", relleno: "#0E100F", pantalla: "#0E100F", burbujas: false };
const ENCENDIDO: Estilo = { trazo: "#0E100F", relleno: "#FFFCE1", pantalla: "#FFFFFF", burbujas: true };

/** Una mancha irregular cerrada (la luz), determinista: misma semilla, mismo dibujo. */
export function mancha(cx: number, cy: number, rx: number, ry: number, semilla: number, n = 16, variacion = 0.07) {
  let s = semilla;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const p: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (azar() * 2 - 1) * variacion;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [p[(i - 1 + n) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return `${d}Z`;
}

const linea = (d: string, color: string, ancho = 6, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const forma = (d: string, e: Estilo, ancho = 6, relleno = e.relleno) =>
  `<path d="${d}" fill="${relleno}" stroke="${e.trazo}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** La ventana con la luna y el letrero de CERRADO (la luna y el letrero alumbran solos). */
function ventana(e: Estilo) {
  return [
    forma("M27 412Q100 408 176 411L178 560Q102 563 25 561Z", e, 6),
    linea("M101 413Q99 486 102 560M27 486Q101 489 177 485", e.trazo, 4.5),
    linea("M16 566Q100 561 188 566", e.trazo, 6),
    // Luna en cuarto y dos estrellas: son luz propia, siempre crema.
    `<path d="M151 424C138 424 128 435 129 448C130 461 141 470 154 469C147 465 142 457 142 447C142 437 146 429 151 424Z" fill="#FFFCE1"/>`,
    linea("M51 428v13M44.5 434.5h13", "#FFFCE1", 3),
    linea("M78 456v9M73.5 460.5h9", "#FFFCE1", 2.6),
  ].join("");
}

/** El letrero colgado en el vidrio: crema con letra de tinta, para que se lea en lo oscuro. */
function letrero() {
  return [
    linea("M52 488L60 506M96 488L88 506", "#FFFCE1", 2.4),
    `<path d="M33 506Q74 503 116 507L114 537Q73 540 34 536Z" fill="#FFFCE1" stroke="#0E100F" stroke-width="3" stroke-linejoin="round"/>`,
    `<text x="74" y="528" text-anchor="middle" font-size="18" fill="#0E100F" style="font-family:var(--f-mano),cursive;letter-spacing:.06em">CERRADO</text>`,
  ].join("");
}

/** El calendario de taco: la hoja de hoy se arranca para pasar al día siguiente. */
function calendario(e: Estilo, dia = "14", semana = "MIÉ") {
  const papel = e.relleno === "#0E100F" ? e.relleno : "#FFFFFF";
  const letra = e.relleno === "#0E100F" ? e.trazo : "#0E100F";
  return [
    forma("M214 422Q255 419 297 422L296 512Q255 515 215 513Z", e, 5, papel),
    forma("M212 410Q255 407 299 410L299 426Q255 429 212 426Z", e, 5, e.trazo),
    `<circle cx="236" cy="418" r="3.4" fill="${e.relleno}"/><circle cx="276" cy="418" r="3.4" fill="${e.relleno}"/>`,
    `<text x="256" y="447" text-anchor="middle" font-size="13" fill="${letra}" style="font-family:var(--f-texto),sans-serif;font-weight:600;letter-spacing:.12em">OCT</text>`,
    `<text x="256" y="488" text-anchor="middle" font-size="42" fill="${letra}" style="font-family:var(--f-titular),sans-serif;font-weight:800">${dia}</text>`,
    `<text x="256" y="506" text-anchor="middle" font-size="13" fill="${letra}" style="font-family:var(--f-texto),sans-serif;font-weight:600;letter-spacing:.12em">${semana}</text>`,
  ].join("");
}

/** El reloj de pared en 23:47: la hora en 353.5° y el minutero en 282°. */
function reloj(e: Estilo) {
  const cx = 392;
  const cy = 452;
  const punta = (grados: number, largo: number) => {
    const a = ((grados - 90) * Math.PI) / 180;
    return `${(cx + Math.cos(a) * largo).toFixed(1)} ${(cy + Math.sin(a) * largo).toFixed(1)}`;
  };
  return [
    forma(`M${cx} ${cy - 37}C${cx + 21} ${cy - 37} ${cx + 37} ${cy - 20} ${cx + 36} ${cy + 1}C${cx + 36} ${cy + 22} ${cx + 20} ${cy + 37} ${cx - 1} ${cy + 36}C${cx - 22} ${cy + 36} ${cx - 37} ${cy + 20} ${cx - 36} ${cy}C${cx - 36} ${cy - 21} ${cx - 21} ${cy - 37} ${cx} ${cy - 37}Z`, e, 6),
    linea(`M${cx} ${cy - 30}v7M${cx + 30} ${cy}h-7M${cx} ${cy + 30}v-7M${cx - 30} ${cy}h7`, e.trazo, 4),
    linea(`M${cx} ${cy}L${punta(353.5, 17)}`, e.trazo, 6),
    linea(`M${cx} ${cy}L${punta(282, 25)}`, e.trazo, 4.5),
    `<circle cx="${cx}" cy="${cy}" r="4" fill="${e.trazo}"/>`,
  ].join("");
}

/** El mostrador de la recepción, con su maceta. */
function mostrador(e: Estilo) {
  return [
    forma("M36 668L41 834Q240 842 444 834L450 666Z", e, 6),
    linea("M150 676Q148 752 152 830M262 678Q264 754 260 832M360 676Q358 752 362 830", e.trazo, 4, ' opacity=".7"'),
    linea("M42 818Q240 826 444 818", e.trazo, 4),
    forma("M20 652Q240 641 460 649L463 670Q240 678 17 672Z", e, 6),
    // Maceta con tres hojas
    forma("M48 650L53 614Q74 611 95 614L99 650Z", e, 5),
    linea("M50 615Q74 609 98 615", e.trazo, 5),
    forma("M72 612C55 598 44 578 50 560C66 568 75 588 72 612Z", e, 4.5),
    forma("M74 612C80 590 92 576 108 572C106 592 92 606 74 612Z", e, 4.5),
    forma("M73 612C68 590 70 566 80 550C88 570 84 592 73 612Z", e, 4.5),
  ].join("");
}

/** El celular de la clínica en su base. Encendido, la pantalla alumbra y se ven dos burbujitas. */
function telefono(e: Estilo) {
  return [
    forma("M292 652L306 622H342L356 652Z", e, 5),
    forma("M309 548Q323 546 338 548Q347 549 347 559L346 632Q346 641 337 641L310 642Q300 642 300 632L299 559Q299 548 309 548Z", e, 5.5),
    `<path d="M306 558Q323 556 340 558L339 628Q323 630 307 628Z" fill="${e.pantalla}"/>`,
    e.burbujas ? `<path d="M310 568h18q3 0 3 3v5q0 3-3 3h-18z" fill="#FFFCE1" stroke="#0E100F" stroke-width="1.8"/>` : "",
    linea("M318 635h11", e.trazo, 3),
  ].join("");
}

/** El piso, apenas una línea. */
function piso(e: Estilo) {
  return linea("M0 846Q120 841 240 846T480 843", e.trazo, 5);
}

/** El consultorio completo en un estilo. */
function consultorio(e: Estilo, conLetrero: boolean) {
  return piso(e) + ventana(e) + (conLetrero ? letrero() : "") + calendario(e) + reloj(e) + mostrador(e) + telefono(e);
}

export const FILTRO_FONDO = `<filter id="tinta-fondo" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5"/>
  <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

/** Lo de fuera de la luz. */
export function dibujoApagado() {
  return consultorio(APAGADO, true);
}

/**
 * Lo de dentro de una luz: la mancha crema y el consultorio en tinta, recortado por ella.
 * Con la pantalla apagada (la luz chica del final), el celular ya no alumbra ni enseña burbujas.
 */
export function dibujoEncendido(id: string, x: number, y: number, r: number, semilla: number, pantallaEncendida = true) {
  const borde = mancha(x, y, r, r * 0.96, semilla);
  const estilo = pantallaEncendida ? ENCENDIDO : { ...ENCENDIDO, pantalla: "#0E100F", burbujas: false };
  return `<clipPath id="${id}"><path d="${borde}"/></clipPath>
    <path d="${borde}" fill="#FFFCE1"/>
    <g clip-path="url(#${id})">${consultorio(estilo, false)}</g>`;
}
