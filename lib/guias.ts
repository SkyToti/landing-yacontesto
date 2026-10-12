/**
 * Las guías de yacontesto.com (SEO-2, 12-oct-2026; plan en investigacion/seo/PLAN-SEO.md, fase 2): una página
 * por duda real de los dentistas. De esta lista salen el índice (/guias/), cada página, su ficha Article, el
 * sitemap y lo que revisa scripts/seo.mjs. El cuerpo de cada guía vive en components/guias/.
 *
 * Reglas de cada guía (PLAN-SEO.md):
 * - lo que dice del producto se coteja contra el código del bot (regla 2): nada de recordatorios, reportes ni
 *   panel;
 * - cada cifra lleva su fuente abierta con la fecha en que se consultó, o no va;
 * - Diego aprueba el texto antes de publicar.
 *
 * Las fechas: `actualizada` es la del último cambio del texto y se cambia en el mismo commit. De ahí salen la
 * fecha que se ve, el `dateModified` de la ficha y el `lastmod` del sitemap. Google solo usa fechas verdaderas.
 */
export type Guia = {
  /** La dirección: /guias/<slug>/. No se cambia una vez publicada. */
  slug: string;
  /** El H1 y el `headline` de la ficha: el título completo. */
  titulo: string;
  /** El `<title>`: ≤ 60 letras para que Google no lo corte. */
  tituloCorto: string;
  /** La descripción del resultado de Google: ≤ 160 letras. */
  descripcion: string;
  /** AAAA-MM-DD. */
  publicada: string;
  /** AAAA-MM-DD. */
  actualizada: string;
};

export const GUIAS = [
  {
    slug: "secretaria-recepcionista-ia-dentistas",
    titulo: "Secretaria o recepcionista con IA para dentistas: qué hace, qué no y cuánto cuesta en México",
    tituloCorto: "Secretaria con IA para dentistas: qué hace y cuánto cuesta",
    descripcion:
      "Qué hace una secretaria o recepcionista con IA en el WhatsApp de tu clínica dental, qué no hace, cuánto cuesta en México y qué preguntar antes de contratar.",
    publicada: "2026-10-12",
    actualizada: "2026-10-12",
  },
] as const satisfies readonly Guia[];

export type SlugGuia = (typeof GUIAS)[number]["slug"];

export const rutaDeGuia = (slug: string) => `/guias/${slug}/`;

export const guiaPorSlug = (slug: string): Guia | undefined => GUIAS.find((g) => g.slug === slug);

/** La fecha más reciente de todas las guías: la del índice. */
export const ultimaActualizacion = () => GUIAS.map((g) => g.actualizada).sort().at(-1) ?? "";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «2026-10-12» → «12 de octubre de 2026», como la fecha del aviso de privacidad. */
export function fechaLegible(iso: string) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}
