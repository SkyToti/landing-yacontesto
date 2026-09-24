import type { MetadataRoute } from "next";

// Exportación estática: se genera una vez, al compilar.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://yacontesto.com/", changeFrequency: "monthly", priority: 1 }];
}
