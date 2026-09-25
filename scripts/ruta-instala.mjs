// Prueba del error que vio Diego en «En 7 días» (24-sep): la ruta empezaba a pintarse por los
// dos extremos a la vez. Fotografía la línea visible (horizontal en escritorio, vertical en
// celular) en varios momentos del dibujo y cuenta los tramos oscuros a lo largo: debe haber uno
// solo y empezar en el origen (izquierda, o arriba en celular).
// Uso (después de `npm run build`): node scripts/ruta-instala.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium, webkit } from "playwright";
import sharp from "sharp";

const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(3251, r));

let fallas = 0;
for (const [motor, ancho, alto] of [
  [chromium, 1891, 887],
  [chromium, 1440, 900],
  [webkit, 390, 664],
]) {
  const navegador = await motor.launch();
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.goto("http://localhost:3251/");
  await pagina.evaluate(() => window.scrollTo(0, 1));
  await pagina.waitForFunction(() => window.__historiaLista === true);
  await pagina.evaluate(() => window.__historia.construirTodo());
  const nombre = `${motor.name()} ${ancho}×${alto}`;
  const problemas = [];
  // Momentos del dibujo: la escena subiendo (su borde de arriba al 40 %, 20 % y 5 % de la
  // pantalla) y ya fija, al principio de la ruta.
  for (const f of [0.4, 0.2, 0.05, -0.15, -0.35]) {
    await pagina.evaluate((fr) => {
      const s = document.querySelector("#instala");
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * fr);
    }, f);
    await pagina.waitForTimeout(ancho >= 900 ? 900 : 600);
    const caja = await pagina.evaluate(() => {
      const linea = [...document.querySelectorAll(".ruta-linea")].find((l) => getComputedStyle(l).display !== "none");
      const r = linea.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, vertical: r.height > r.width };
    });
    if (caja.w < 2 || caja.h < 2 || caja.y + caja.h > alto || caja.y < 0) continue;
    const png = await pagina.screenshot({ clip: { x: Math.floor(caja.x), y: Math.floor(caja.y), width: Math.ceil(caja.w), height: Math.ceil(caja.h) } });
    const { data, info } = await sharp(png).grayscale().raw().toBuffer({ resolveWithObject: true });
    const largo = caja.vertical ? info.height : info.width;
    const grueso = caja.vertical ? info.width : info.height;
    // Oscuro: el trazo (--marca) sobre porcelana; la guía (--linea) es gris claro.
    const oscuro = [];
    for (let a = 0; a < largo; a++) {
      let hay = false;
      for (let g = 0; g < grueso && !hay; g++) {
        const i = caja.vertical ? a * info.width + g : g * info.width + a;
        if (data[i] < 110) hay = true;
      }
      oscuro.push(hay);
    }
    const tramos = [];
    for (let a = 0; a < largo; a++) {
      if (oscuro[a] && (a === 0 || !oscuro[a - 1])) tramos.push([a, a]);
      if (oscuro[a]) tramos[tramos.length - 1][1] = a;
    }
    if (tramos.length > 1 || (tramos.length === 1 && tramos[0][0] > largo * 0.05)) {
      problemas.push(`escena al ${Math.round(f * 100)} %: ${tramos.length} tramos (${tramos.map((t) => `${t[0]}–${t[1]}`).join(", ")} de ${largo} px)`);
    }
  }
  if (problemas.length) {
    fallas++;
    console.log(`${nombre}: FALLA · ${problemas.join(" · ")}`);
  } else console.log(`${nombre}: bien · la ruta se pinta de un solo lado`);
  await navegador.close();
}
servidor.close();
process.exit(fallas ? 1 : 0);
