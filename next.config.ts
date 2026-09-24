import type { NextConfig } from "next";

// Sitio estático: GitHub Pages sirve la carpeta `out/` en yacontesto.com.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // Una sola página y casi todos los visitantes son nuevos: el CSS va en el HTML y no bloquea.
  experimental: { inlineCss: true },
};

export default nextConfig;
