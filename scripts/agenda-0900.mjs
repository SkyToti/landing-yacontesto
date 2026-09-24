// Prueba del error que vio Diego a las 09:00 (24-sep): bajando poco a poco, la agenda del jueves
// aparecía completa de golpe, luego desaparecía y se volvía a dibujar. Recorre ese tramo de a 10 px
// y falla si la parte visible de la agenda retrocede mientras se baja (solo debe crecer).
// Uso (después de `npm run build`): node scripts/agenda-0900.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium, webkit } from "playwright";

const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(3249, r));

// La parte visible de la agenda: 0 si su escena está apagada; si no, lo que deja ver su clip-path.
function medir() {
  const escena = document.querySelector("[data-dia-escena]");
  const hoja = escena.querySelector(".dia-agenda");
  const rg = document.querySelector("[data-reloj-grande]");
  const opEscena = Number(getComputedStyle(escena).opacity);
  const clip = getComputedStyle(hoja).clipPath;
  const abajo = /inset\(\s*[\d.]+%?\s+[\d.]+%?\s+([\d.]+)%/.exec(clip);
  const visible = opEscena < 0.05 ? 0 : 1 - (abajo ? Number(abajo[1]) / 100 : 0);
  return { visible: Math.round(visible * 100) / 100, opEscena, rg: Number(getComputedStyle(rg).opacity).toFixed(2) };
}

let fallas = 0;
for (const [motor, ancho, alto] of [
  [chromium, 1891, 887],
  [chromium, 1440, 900],
  [webkit, 390, 664],
]) {
  const navegador = await motor.launch();
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.goto("http://localhost:3249/");
  await pagina.evaluate(() => window.scrollTo(0, 1));
  await pagina.waitForFunction(() => window.__historiaLista === true);
  await pagina.evaluate(() => window.__historia.construirTodo());
  const puntos = await pagina.evaluate(() => window.__historia.puntos());
  const desde = puntos.find((p) => p.nombre === "09-amanece").y;
  const hasta = puntos.find((p) => p.nombre === "10-la-cita-ya-esta").y;
  let maximo = 0;
  let peor = null;
  for (let y = desde; y <= hasta; y += 10) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(ancho >= 900 ? 750 : 500);
    const m = await pagina.evaluate(medir);
    if (maximo - m.visible > 0.1 && (!peor || maximo - m.visible > peor.caida)) peor = { y, caida: Math.round((maximo - m.visible) * 100) / 100, de: maximo, a: m.visible, rg: m.rg };
    maximo = Math.max(maximo, m.visible);
  }
  const nombre = `${motor.name()} ${ancho}×${alto}`;
  if (peor) {
    fallas++;
    console.log(`${nombre}: FALLA · la agenda se veía al ${Math.round(peor.de * 100)} % y bajando volvió al ${Math.round(peor.a * 100)} % (y ${peor.y}, reloj grande a ${peor.rg})`);
  } else console.log(`${nombre}: bien · la agenda solo crece al bajar`);
  await navegador.close();
}
servidor.close();
process.exit(fallas ? 1 : 0);
