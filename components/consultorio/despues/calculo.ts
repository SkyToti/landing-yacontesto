import { PRECIO, detalleDe, escalonDe, mensualidad } from "@/components/historia/datos";

/**
 * Las cuentas y la geometría de la calculadora, sin React: las usan el HTML del servidor (Calculadora) y el
 * guion que la conecta en el navegador (conectarCalculadora). Así no hay que hidratarla: hidratarla con React
 * costaba de 40 a 57 ms con CPU 4×, justo cuando el pulgar se acercaba al precio.
 */
export const MAXIMO = 1200;
export const INICIAL = 150;
const TOPE_GRAFICA = 2700;
const fmt = (n: number) => n.toLocaleString("es-MX");
export const precio = (n: number) => `$${fmt(n)}`;

// La escalera en coordenadas de la gráfica (600 × 220), la misma de PrecioInteractivo.
const x = (p: number) => (p / MAXIMO) * 600;
const y = (total: number) => 220 - (total / TOPE_GRAFICA) * 220;
const { base, hasta, segundo, hastaSegundo, porPacienteExtra } = PRECIO.escalones;
export const PUNTOS = [
  [0, y(base)],
  [x(hasta), y(base)],
  [x(hasta), y(segundo)],
  [x(hastaSegundo), y(segundo)],
  [600, y(mensualidad(MAXIMO))],
]
  .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
  .join(" ");
export const ETIQUETAS = [
  { texto: precio(base), left: "1%", top: `${(y(base) / 220) * 100}%` },
  { texto: precio(segundo), left: `${(hasta / MAXIMO) * 100 + 1}%`, top: `${(y(segundo) / 220) * 100}%` },
  { texto: `+ $${porPacienteExtra} por paciente`, right: "1%", top: "74%" },
];
export const MARCAS = { hasta, hastaSegundo };

/** Todo lo que cambia con el número de pacientes. */
export function estadoDe(pacientes: number) {
  const total = mensualidad(pacientes);
  return {
    total,
    escalon: escalonDe(pacientes),
    detalle: detalleDe(pacientes),
    cuantos: `${fmt(pacientes)} pacientes`,
    mes: precio(total),
    px: `${(pacientes / MAXIMO) * 100}%`,
    py: `${(1 - total / TOPE_GRAFICA) * 100}%`,
    valuetext: `${fmt(pacientes)} pacientes al mes: ${precio(total)} al mes`,
  };
}

/** En el navegador: el deslizador mueve la gráfica y el precio, tocando solo lo que cambia. */
export function conectarCalculadora(raiz: HTMLElement) {
  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;
  const input = q<HTMLInputElement>("#pacientes");
  const cuantos = q(".calc-cuantos");
  const mes = q(".calc-mes b");
  const detalle = q(".calc-detalle");
  const linea = q(".calc-linea");
  const punto = q(".calc-punto");
  const escalones = Array.from(raiz.querySelectorAll<HTMLElement>(".calc-escalon"));
  const pintar = () => {
    const e = estadoDe(Number(input.value));
    cuantos.textContent = e.cuantos;
    mes.textContent = e.mes;
    detalle.textContent = e.detalle;
    linea.style.left = e.px;
    punto.style.left = e.px;
    punto.style.top = e.py;
    input.style.setProperty("--llenado", e.px);
    input.setAttribute("aria-valuetext", e.valuetext);
    escalones.forEach((el, i) => el.toggleAttribute("data-activo", i === e.escalon));
  };
  input.addEventListener("input", pintar);
  // Si el navegador recordó otro valor (volver atrás), la gráfica lo alcanza.
  if (Number(input.value) !== INICIAL) pintar();
  return () => input.removeEventListener("input", pintar);
}
