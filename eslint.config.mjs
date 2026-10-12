import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Las guías (SEO-2) enlazan con <a>, no con <Link>: en esta exportación estática la precarga de <Link> pide
  // /guias/__next.guias.__PAGE__.txt y Next lo escribe como carpeta (__next.guias/__PAGE__.txt), así que da 404
  // (Lighthouse lo marcó, 12-oct-2026). Y a la portada hay que llegar con carga completa: su guion de arranque
  // (app/layout.tsx) solo corre al cargar el documento.
  {
    files: ["app/guias/**", "components/guias/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    ".vista-previa/**",
    "build/**",
    "next-env.d.ts",
    // Investigación interna: fuera de git y fuera del sitio.
    "investigacion/**",
  ]),
]);

export default eslintConfig;
