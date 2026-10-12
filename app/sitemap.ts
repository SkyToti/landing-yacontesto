import type { MetadataRoute } from "next";

// Exportación estática: se genera una vez, al compilar.
export const dynamic = "force-static";

// La fecha de cada página es la de su último cambio de contenido (texto, datos estructurados o enlaces), y se
// cambia a mano en el mismo commit. Nunca la fecha de compilación: Google solo usa `lastmod` si es verdadera.
// Sin `priority` ni `changeFrequency`: Google los ignora (Crear un sitemap, act. 8-jul-2026).
// scripts/seo.mjs revisa que la del aviso sea la misma que dice su «Última actualización».
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://yacontesto.com/", lastModified: "2026-10-12" },
    { url: "https://yacontesto.com/privacidad/", lastModified: "2026-10-09" },
  ];
}
