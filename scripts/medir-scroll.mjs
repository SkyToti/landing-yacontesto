// Recorre toda la historia como un visitante (deslizando en celular, con la rueda en escritorio)
// en Chromium con CPU 4× y reporta las tareas largas que ocurren mientras se anima.
// Uso: node scripts/medir-scroll.mjs [--ancho 375] [--alto 812]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const ancho = Number(args[args.indexOf("--ancho") + 1]) || 375;
const alto = Number(args[args.indexOf("--alto") + 1]) || 812;
const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(3225, r));
// Si algo se cuelga, que el script lo diga en vez de quedarse esperando para siempre.
setTimeout(() => {
  console.log("Se pasó de 4 minutos: medición abortada.");
  process.exit(2);
}, 240_000).unref();

const movil = ancho < 900;
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: movil ? 3 : 1, isMobile: movil, hasTouch: movil });
const pagina = await contexto.newPage();
const cdp = await contexto.newCDPSession(pagina);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await pagina.addInitScript(() => {
  window.__largas = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__largas.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
});
const errores = [];
pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
pagina.on("pageerror", (e) => errores.push(String(e)));
await pagina.goto("http://localhost:3225/", { waitUntil: "load" });
await pagina.waitForTimeout(6000); // carga, precarga de GSAP y teléfono en ocio
const inicio = await pagina.evaluate(() => performance.now());
await pagina.mouse.move(ancho / 2, alto / 2);
const total = await pagina.evaluate(() => document.documentElement.scrollHeight - innerHeight);
if (movil) {
  // En Chromium sin ventana, con isMobile, ni la rueda ni el gesto táctil sintético desplazan la
  // página (se cuelgan o no hacen nada). En un celular el compositor avanza el scroll aunque el hilo
  // principal vaya atrasado: aquí igual, la posición depende del tiempo (1 px/ms), no de los cuadros.
  await pagina.evaluate(
    (total) =>
      new Promise((fin) => {
        const t0 = performance.now();
        const paso = (t) => {
          const y = Math.min(total, (t - t0) * 1);
          window.scrollTo(0, y);
          if (y < total) requestAnimationFrame(paso);
          else fin();
        };
        requestAnimationFrame(paso);
      }),
    total,
  );
} else {
  // Pasos de 100 px cada 90 ms, como una rueda que no para, hasta el fondo (la página crece al
  // armarse y Lenis suaviza con retraso, así que se mide dónde va y no cuántos pasos se dieron).
  const falta = () => pagina.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
  for (let i = 0; i < total / 50 && (i % 20 !== 0 || (await falta()) > 2); i++) {
    await pagina.mouse.wheel(0, 100);
    await pagina.waitForTimeout(90);
  }
}
await pagina.waitForTimeout(1500);
const r = await pagina.evaluate((t) => ({ largas: window.__largas.filter(([s]) => s >= t), lista: window.__historiaLista === true, alto: document.documentElement.scrollHeight, y: Math.round(scrollY) }), inicio);
const peor = r.largas.reduce((m, [, d]) => Math.max(m, d), 0);
console.log(`${ancho}×${alto} · CPU 4× · historia ${r.lista ? "armada" : "sin armar"} · alto ${r.alto}px · llegó a y=${r.y}`);
console.log(`Tareas largas durante el scroll: ${r.largas.length} · la peor: ${peor} ms · > 200 ms: ${r.largas.filter(([, d]) => d > 200).length}`);
console.log(JSON.stringify(r.largas));
console.log(`Errores de consola: ${errores.length}`, errores.slice(0, 3));
await navegador.close();
servidor.close();
