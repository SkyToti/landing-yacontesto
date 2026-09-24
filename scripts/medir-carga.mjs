// Mide FCP, LCP (con su elemento) y tareas largas en Chromium con CPU 4× y 4G lenta.
// Uso (después de `npm run build`): node scripts/medir-carga.mjs [--sinjs] [--veces 3]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const sinJs = args.includes("--sinjs");
const veces = Number(args[args.indexOf("--veces") + 1]) || 3;
const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  const tipo = TIPOS[extname(archivo)] ?? "application/octet-stream";
  let cuerpo = await readFile(archivo);
  const comprimir = /html|javascript|css|svg/.test(tipo);
  if (comprimir) cuerpo = gzipSync(cuerpo);
  res.writeHead(200, { "content-type": tipo, ...(comprimir ? { "content-encoding": "gzip" } : {}), "cache-control": "no-store" });
  res.end(cuerpo);
});
await new Promise((r) => servidor.listen(3220, r));

const navegador = await chromium.launch();
const resultados = [];
for (let i = 0; i < veces; i++) {
  const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, javaScriptEnabled: !sinJs });
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send("Network.enable");
  // «Slow 4G» de DevTools: 150 ms de latencia, 1.6 Mb/s de bajada, 750 kb/s de subida.
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await pagina.addInitScript(() => {
    window.__lcp = [];
    window.__largas = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push({ t: Math.round(e.startTime), el: `${e.element?.tagName}.${e.element?.className}`, texto: (e.element?.textContent || "").slice(0, 30) }))).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__largas.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
  });
  await pagina.goto("http://localhost:3220/", { waitUntil: "load" });
  // El primer gesto del visitante arma la historia (las tareas de armado se miden después).
  await pagina.waitForTimeout(3500);
  if (!sinJs) await pagina.mouse.wheel(0, 1);
  await pagina.waitForTimeout(sinJs ? 3000 : 8000);
  const r = sinJs
    ? { fcp: "(sin JS no hay observador)" }
    : await pagina.evaluate(() => ({
        fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1),
        lcp: window.__lcp,
        largas: window.__largas,
        lista: window.__historiaLista === true,
        armado: performance.getEntriesByType("measure").filter((m) => m.name.startsWith("historia:")).map((m) => [m.name.slice(9), Math.round(m.startTime), Math.round(m.duration)]),
        cls: 0,
      }));
  resultados.push(r);
  console.log(JSON.stringify(r));
  await contexto.close();
}
await navegador.close();
servidor.close();
