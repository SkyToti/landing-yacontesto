// Perfil de carga: graba una traza de Chromium y suma el trabajo del hilo principal por tipo de
// evento, antes y después de la primera pintura. Uso: node scripts/perfil.mjs [--cpu 4] [--ms 6000]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const cpu = Number(args[args.indexOf("--cpu") + 1]) || 1;
const ventana = Number(args[args.indexOf("--ms") + 1]) || 6000;
const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(3230, r));

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
const pagina = await contexto.newPage();
const cdp = await contexto.newCDPSession(pagina);
if (cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
const eventos = [];
cdp.on("Tracing.dataCollected", ({ value }) => eventos.push(...value));
const fin = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,loading", transferMode: "ReportEvents" });
await pagina.goto("http://localhost:3230/", { waitUntil: "load" });
await pagina.waitForTimeout(ventana);
await cdp.send("Tracing.end");
await fin;

const nav = eventos.find((e) => e.name === "navigationStart" || e.name === "TracingStartedInBrowser");
const t0 = Math.min(...eventos.filter((e) => e.ts > 0).map((e) => e.ts));
const fcp = eventos.find((e) => e.name === "firstContentfulPaint");
const tFcp = fcp ? (fcp.ts - t0) / 1000 : Infinity;
// Hilo principal del renderer: el que tiene «CrRendererMain».
const hilo = eventos.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
const principal = eventos.filter((e) => hilo && e.pid === hilo.pid && e.tid === hilo.tid && e.ph === "X" && e.dur);
const suma = (desde, hasta) => {
  const acc = {};
  for (const e of principal) {
    const t = (e.ts - t0) / 1000;
    if (t < desde || t >= hasta) continue;
    acc[e.name] = (acc[e.name] ?? 0) + e.dur / 1000;
  }
  return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}: ${Math.round(v)}`);
};
console.log(`CPU ${cpu}× · FCP ${Math.round(tFcp)} ms (t0 = inicio de la traza; nav ${nav ? "sí" : "no"})`);
console.log("Antes de la FCP:", suma(0, tFcp).join(" · "));
console.log("Después:", suma(tFcp, 1e9).join(" · "));
const largas = principal.filter((e) => e.name === "RunTask" && e.dur > 50000).map((e) => [Math.round((e.ts - t0) / 1000), Math.round(e.dur / 1000)]);
console.log("Tareas > 50 ms:", JSON.stringify(largas));
await navegador.close();
servidor.close();
