import type { MetadataRoute } from "next";
import { GUIAS, rutaDeGuia, ultimaActualizacion } from "@/lib/guias";

// Exportación estática: se genera una vez, al compilar.
export const dynamic = "force-static";

const SITIO = "https://yacontesto.com";

// La fecha de cada página es la de su último cambio de contenido (texto, datos estructurados o enlaces), y se
// cambia a mano en el mismo commit. Nunca la fecha de compilación: Google solo usa `lastmod` si es verdadera.
// Sin `priority` ni `changeFrequency`: Google los ignora (Crear un sitemap, act. 8-jul-2026).
// scripts/seo.mjs revisa que la del aviso sea la misma que dice su «Última actualización», y que cada guía
// tenga la de lib/guias.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITIO}/`, lastModified: "2026-10-12" },
    { url: `${SITIO}/privacidad/`, lastModified: "2026-10-09" },
    { url: `${SITIO}/guias/`, lastModified: ultimaActualizacion() },
    ...GUIAS.map((guia) => ({ url: `${SITIO}${rutaDeGuia(guia.slug)}`, lastModified: guia.actualizada })),
  ];
}
