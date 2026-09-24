// Vista previa en Vercel SIN push: copia out/ a .vista-previa/yacontesto-rediseno, le pone noindex
// (no debe competir en buscadores con yacontesto.com) y la sube con la CLI de Vercel.
//
// Requisito, una sola vez y lo hace Diego: `npx vercel login`.
// Uso (después de `npm run build`): node scripts/vista-previa.mjs            → prepara y sube
//                                    node scripts/vista-previa.mjs --solo-preparar
// La CLI crea (la primera vez) el proyecto «yacontesto-rediseno», aparte y sin dominio, y responde
// con su URL de producción: https://yacontesto-rediseno.vercel.app (esa es la que se comparte; las
// que traen el sufijo del equipo piden iniciar sesión en Vercel).
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const origen = resolve("out");
const destino = resolve(".vista-previa/yacontesto-rediseno");
if (!existsSync(origen)) throw new Error("No hay out/: corre primero npm run build");

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
await cp(origen, destino, { recursive: true });
await rm(resolve(destino, "CNAME"), { force: true });
await writeFile(resolve(destino, "robots.txt"), "User-Agent: *\nDisallow: /\n");
await writeFile(
  resolve(destino, "vercel.json"),
  JSON.stringify(
    {
      trailingSlash: true,
      headers: [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }],
    },
    null,
    2,
  ),
);
console.log(`Listo para subir: ${destino}`);

if (!process.argv.includes("--solo-preparar")) {
  const r = spawnSync("npx", ["--yes", "vercel", "deploy", destino, "--prod", "--yes"], { stdio: "inherit", shell: true });
  process.exit(r.status ?? 1);
}
