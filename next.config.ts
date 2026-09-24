import type { NextConfig } from "next";

// Sitio estático: GitHub Pages sirve la carpeta `out/` en yacontesto.com.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
