/** Utilidades del Director: el reloj de la historia, el cielo y la geometría del vuelo. */

export const DIAS = ["mié", "jue", "vie", "sáb", "dom", "lun", "mar"];

/** Minutos desde el miércoles 00:00 → «mié», «23:47». */
export function horaDe(minutos: number) {
  const m = Math.max(0, Math.floor(minutos + 1e-6));
  const dia = DIAS[Math.floor(m / 1440) % 7];
  const hh = String(Math.floor((m % 1440) / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return { dia, hora: `${hh}:${mm}` };
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Paletas de la muesca para cada hora del cielo (se interpolan con la misma f del cielo). */
export const PALETAS = [
  // noche
  {
    "--muesca-fondo": "rgb(11, 58, 32)",
    "--muesca-tinta": "rgb(232, 241, 236)",
    "--muesca-suave": "rgb(168, 188, 178)",
    "--muesca-linea": "rgba(255, 255, 255, 0.16)",
    "--muesca-linea-2": "rgba(255, 255, 255, 0.07)",
    "--muesca-hora": "rgb(242, 184, 75)",
    "--muesca-marca": "rgb(145, 213, 184)",
    "--muesca-sobre-marca": "rgb(12, 61, 34)",
  },
  // madrugada
  {
    "--muesca-fondo": "rgb(11, 55, 33)",
    "--muesca-tinta": "rgb(232, 241, 236)",
    "--muesca-suave": "rgb(188, 210, 198)",
    "--muesca-linea": "rgba(255, 255, 255, 0.16)",
    "--muesca-linea-2": "rgba(255, 255, 255, 0.07)",
    "--muesca-hora": "rgb(242, 184, 75)",
    "--muesca-marca": "rgb(145, 213, 184)",
    "--muesca-sobre-marca": "rgb(12, 61, 34)",
  },
  // alba
  {
    "--muesca-fondo": "rgb(147, 200, 173)",
    "--muesca-tinta": "rgb(15, 29, 22)",
    "--muesca-suave": "rgb(33, 51, 42)",
    "--muesca-linea": "rgba(15, 29, 22, 0.16)",
    "--muesca-linea-2": "rgba(15, 29, 22, 0.08)",
    "--muesca-hora": "rgb(110, 62, 0)",
    "--muesca-marca": "rgb(12, 61, 34)",
    "--muesca-sobre-marca": "rgb(255, 255, 255)",
  },
  // día
  {
    "--muesca-fondo": "rgb(247, 249, 248)",
    "--muesca-tinta": "rgb(15, 29, 22)",
    "--muesca-suave": "rgb(75, 91, 83)",
    "--muesca-linea": "rgba(15, 29, 22, 0.14)",
    "--muesca-linea-2": "rgba(15, 29, 22, 0.07)",
    "--muesca-hora": "rgb(154, 88, 0)",
    "--muesca-marca": "rgb(12, 61, 34)",
    "--muesca-sobre-marca": "rgb(255, 255, 255)",
  },
];

/**
 * Minutos del día → f del cielo (0 noche, 1 madrugada, 2 alba, 3 día). En Cuernavaca, en
 * octubre, amanece hacia las 06:50: la madrugada aclara desde las 04:30 y a las 08:30 ya es de día.
 * El paso de madrugada a alba (del verde oscuro al menta claro) es el que más cambia la pantalla:
 * se le da hora y media, y lo mismo al atardecer, para que no se vea como un destello.
 */
export function cieloPorHora(minutosDelDia: number) {
  const h = minutosDelDia / 60;
  if (h < 4.5) return 0;
  if (h < 5.75) return (h - 4.5) / 1.25;
  if (h < 7.25) return 1 + (h - 5.75) / 1.5;
  if (h < 8.5) return 2 + (h - 7.25) / 1.25;
  // Atardece: a las 18:40 se mete el sol y hacia las 20:15 ya es de noche.
  if (h < 17.75) return 3;
  if (h < 18.5) return 3 - (h - 17.75) / 0.75;
  if (h < 19.5) return 2 - (h - 18.5) / 1;
  if (h < 20.25) return 1 - (h - 19.5) / 0.75;
  return 0;
}

/** Rectángulo de `el` relativo a `base`, con las transformaciones de `sin` apagadas un instante. */
export function rectoRelativo(el: Element, base: Element, sin: HTMLElement[] = []) {
  const antes = sin.map((n) => [n, n.style.transform, n.style.translate] as const);
  sin.forEach((n) => {
    n.style.transform = "none";
  });
  const r = el.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  antes.forEach(([n, t]) => {
    n.style.transform = t;
  });
  return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
}

/** Cede el hilo un cuadro (o 60 ms si la pestaña está oculta y no hay cuadros). */
export const esperarCuadro = () =>
  new Promise<void>((resolver) => {
    const reserva = setTimeout(resolver, 60);
    requestAnimationFrame(() => {
      clearTimeout(reserva);
      resolver();
    });
  });
