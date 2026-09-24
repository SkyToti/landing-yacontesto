import type { MetadataRoute } from "next";

// Exportación estática: se genera una vez, al compilar.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://yacontesto.com/sitemap.xml",
  };
}
