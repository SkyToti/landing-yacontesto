/**
 * Las partes de Moli, copiadas de su hoja de personaje aprobada
 * (`proyecto/ventas/rebranding/personaje/personaje-yacontesto.html`, 5-oct-2026). No se redibuja:
 * cada pieza es la misma cadena SVG de la hoja, en su lienzo de 400 × 420.
 *
 * Único cambio: los `clipPath` de las bocas llevan un prefijo, porque en la página hay más de un
 * Moli y dos `id` iguales se pisan.
 *
 * Caras nuevas solo como combinación de piezas que ya existen (regla del guion, sección 1):
 * «dormita» y «bosteza» no tienen ningún trazo nuevo.
 */

export const T = "#0E100F";
export const C = "#FFFCE1";
export const V = "#0AE448";
export const L = "#ABFF84";

const MUELA =
  "M118 168C106 112 140 74 178 82C196 86 206 98 214 104C226 92 246 76 274 80C318 88 326 140 314 186C306 222 300 250 288 272C282 300 280 330 266 348C256 360 242 356 238 340C234 320 230 302 214 300C198 300 192 318 186 336C180 354 164 360 154 346C142 326 140 300 132 276C124 252 122 214 118 168Z";

type Ojos = "abiertos" | "cerrados" | "guino" | "puntos";
type Cejas = "normal" | "arriba" | "enojo" | "planas";
export type Boca = "dientes" | "apretada" | "abierta" | "o" | "tres" | "linea" | "sonrisa";

const OJOS: Record<Ojos, (mx?: number, my?: number) => string> = {
  abiertos: (mx = 0, my = 0) => `
    <ellipse cx="${206 + mx}" cy="${160 + my}" rx="10" ry="14" fill="${T}"/>
    <circle cx="${209 + mx}" cy="${154 + my}" r="3.6" fill="${C}"/>
    <ellipse cx="${256 + mx}" cy="${156 + my}" rx="10" ry="14" fill="${T}"/>
    <circle cx="${259 + mx}" cy="${150 + my}" r="3.6" fill="${C}"/>`,
  cerrados: () => `
    <path d="M195 164q11-13 22 0M245 160q11-13 22 0" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>`,
  guino: () => `
    <ellipse cx="206" cy="160" rx="10" ry="14" fill="${T}"/><circle cx="209" cy="154" r="3.6" fill="${C}"/>
    <path d="M246 149l18 8-18 8" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  puntos: () => `
    <ellipse cx="206" cy="162" rx="6" ry="8" fill="${T}"/><ellipse cx="256" cy="158" rx="6" ry="8" fill="${T}"/>`,
};

const CEJAS: Record<Cejas, string> = {
  normal: `<path d="M190 136q16-10 32-3M242 131q15-10 31-2" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>`,
  arriba: `<path d="M190 124q16-12 32-5M242 119q15-12 31-4" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>`,
  enojo: `<path d="M190 128l32 12M242 140l31-14" fill="none" stroke="${T}" stroke-width="7.5" stroke-linecap="round"/>`,
  planas: `<path d="M192 136h30M243 132h30" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>`,
};

const CHAPAS = `<ellipse cx="181" cy="184" rx="12" ry="6.5" fill="${L}"/><ellipse cx="289" cy="177" rx="12" ry="6.5" fill="${L}"/>`;
const NARIZ = `<path d="M236 170q11 7 1 17" fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round"/>`;
const SONRISA_FORMA = "M176 200C202 216 264 214 291 196C292 238 266 262 233 262C200 262 176 240 176 200Z";
const ABIERTA_FORMA = "M180 206C210 200 262 198 288 204C286 246 258 263 232 263C204 263 182 245 180 206Z";

const BOCAS: Record<Boca, (p: string) => string> = {
  dientes: (p) => `
    <clipPath id="${p}-sonrisa"><path d="${SONRISA_FORMA}"/></clipPath>
    <path d="${SONRISA_FORMA}" fill="${T}"/>
    <g clip-path="url(#${p}-sonrisa)">
      <ellipse cx="236" cy="262" rx="38" ry="18" fill="${V}"/>
      <path d="M172 196C204 212 266 212 296 194V222C266 236 204 236 172 224Z" fill="${C}"/>
    </g>
    <path d="${SONRISA_FORMA}" fill="none" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M174 199q-8 7-3 16M292 197q8 7 3 16" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round"/>`,
  apretada: () => `
    <path d="M208 218C208 212 212 210 218 210H252C258 210 262 212 262 218V232C262 238 258 240 252 240H218C212 240 208 238 208 232Z" fill="${C}" stroke="${T}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M209 225H261M226 211v28M244 211v28" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/>`,
  abierta: (p) => `
    <clipPath id="${p}-abierta"><path d="${ABIERTA_FORMA}"/></clipPath>
    <path d="${ABIERTA_FORMA}" fill="${T}"/>
    <g clip-path="url(#${p}-abierta)"><ellipse cx="236" cy="258" rx="34" ry="16" fill="${V}"/><path d="M176 200H292V216C262 211 214 212 176 219Z" fill="${C}"/></g>
    <path d="${ABIERTA_FORMA}" fill="none" stroke="${T}" stroke-width="7.5" stroke-linejoin="round"/>`,
  o: () => `
    <ellipse cx="236" cy="226" rx="15" ry="19" fill="${T}"/><ellipse cx="237" cy="234" rx="8" ry="7" fill="${V}"/>`,
  tres: () => `
    <path d="M228 210q16-2 12 9q-3 6-11 6q14 0 11 10q-3 8-13 6" fill="none" stroke="${T}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  linea: () => `<path d="M204 231q16 5 36-2" fill="none" stroke="${T}" stroke-width="7.5" stroke-linecap="round"/>`,
  sonrisa: () => `<path d="M196 216q36 30 74-4" fill="none" stroke="${T}" stroke-width="7.5" stroke-linecap="round"/>`,
};

function diadema() {
  return `
    <path d="M100 196C84 -10 336 -26 322 186" fill="none" stroke="${T}" stroke-width="15" stroke-linecap="round"/>
    <ellipse cx="102" cy="198" rx="23" ry="35" fill="${T}"/>
    <path d="M94 176q-6 16 0 34" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="322" cy="188" rx="23" ry="35" fill="${T}"/>
    <path d="M330 168q6 16 0 34" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round"/>
    <path d="M318 220C324 254 318 268 304 266" fill="none" stroke="${T}" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="296" cy="262" rx="13" ry="11" fill="${V}" stroke="${T}" stroke-width="6"/>`;
}

type Expresion = { ojos: Ojos; cejas: Cejas; boca: Boca; mirada?: [number, number] };

export const EXPRESIONES = {
  normal: { ojos: "abiertos", cejas: "normal", boca: "dientes" },
  sorpresa: { ojos: "puntos", cejas: "arriba", boca: "o" },
  feliz: { ojos: "cerrados", cejas: "arriba", boca: "abierta" },
  guino: { ojos: "guino", cejas: "normal", boca: "sonrisa" },
  concentra: { ojos: "abiertos", cejas: "planas", boca: "linea", mirada: [8, 2] },
  // Combinaciones nuevas, sin trazo nuevo: ojos cerrados + boca de línea, y ojos cerrados + «o».
  dormita: { ojos: "cerrados", cejas: "normal", boca: "linea" },
  bosteza: { ojos: "cerrados", cejas: "arriba", boca: "o" },
} satisfies Record<string, Expresion>;

export type Cara = keyof typeof EXPRESIONES;

/** Los rasgos de una cara; `boca` permite hablar por cuadros sin cambiar ojos ni cejas. */
export function rasgos(p: string, cara: Cara, boca?: Boca) {
  const ex: Expresion = EXPRESIONES[cara];
  const [mx, my] = ex.mirada ?? [0, 0];
  return `<g transform="translate(10 4)">${CHAPAS}${CEJAS[ex.cejas]}${OJOS[ex.ojos](mx, my)}${NARIZ}${BOCAS[boca ?? ex.boca](p)}</g>`;
}

/** El cuerpo de Moli sin los rasgos: muela, sombra y la raya de la raíz. */
export function cuerpo() {
  return `
    <ellipse cx="210" cy="372" rx="92" ry="12" fill="${T}" opacity=".14"/>
    <path d="${MUELA}" fill="${C}" stroke="${T}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M150 300q-6-30 0-52" fill="none" stroke="${T}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
}

export function diademaCompleta() {
  return diadema();
}

/** Mano de guante que señala a la izquierda. El dedo se estira cambiando su largo (92 a 330). */
export function dedo(largo: number) {
  const x = 96 - largo;
  return `M${x + 12} -13C${x - 2} -13 ${x - 2} 13 ${x + 12} 13L100 13L100 -13Z`;
}

export function manoSenala(largo = 92) {
  return `
    <path d="M178 -30H230V46H178Z" fill="${C}" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M186 -30v76M198 -30v76" stroke="${T}" stroke-width="4"/>
    <path class="dedo" d="${dedo(largo)}" fill="${C}" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M90 -22C112 -40 166 -38 178 -6C188 26 154 52 114 48C96 46 84 36 86 20Z" fill="${C}" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M96 22C110 27 126 27 140 22M100 35C114 40 128 40 142 35" fill="none" stroke="${T}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M110 -26C102 -52 134 -60 142 -34" fill="${C}" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>`;
}

/** El filtro de tinta de la hoja: desplaza el trazo para que no haya ninguna curva perfecta. */
export function filtroTinta(id: string, semilla = 3) {
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed="${semilla}"/>
    <feDisplacementMap in="SourceGraphic" scale="3.4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}
