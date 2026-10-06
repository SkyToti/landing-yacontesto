// Mide el cierre de la escena de las 23:47 (de P5 a P6: la cámara regresa al plano general, la luz
// se cierra alrededor de Moli y vuelve a dormitar). Cuenta los cuadros y las tareas largas solo de ese
// tramo, con la CPU 4× más lenta y la GPU encendida (Chromium sin ventana en Windows: --use-angle=d3d11).
// También toma capturas a media animación. Uso: node scripts/r1-cierre.mjs [URL] [etiqueta]
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3100/";
const ETIQUETA = process.argv[3] ?? "medicion";
const SALIDA = "investigacion/r1-capturas/cierre";
const PANTALLAS = 4.75;

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pagina = await contexto.newPage();
const cdp = await contexto.newCDPSession(pagina);
await pagina.addInitScript(() => {
  window.__largas = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__largas.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
});
await pagina.goto(URL, { waitUntil: "networkidle" });
await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
const ir = (p) =>
  pagina.evaluate(
    ({ p, total }) => {
      const s = document.getElementById("noche");
      window.scrollTo(0, s.offsetTop + (p / total) * (s.offsetHeight - innerHeight));
    },
    { p, total: PANTALLAS },
  );
// Llegar a P5 paso a paso (como un visitante) y esperar a que termine su actuación.
for (const p of [1.0, 1.7, 2.35, 3.05, 3.7]) {
  await ir(p);
  await pagina.waitForTimeout(p === 3.7 ? 3500 : 1200);
}
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const gpu = await pagina.evaluate(() => {
  const c = document.createElement("canvas").getContext("webgl");
  const i = c?.getExtension("WEBGL_debug_renderer_info");
  return i ? c.getParameter(i.UNMASKED_RENDERER_WEBGL) : "sin WebGL";
});

// El pulgar baja de P5 a P6 (~0.8 pantallas en ~0.6 s) y luego deja que la página se asiente y actúe.
const medir = pagina.evaluate(async ({ total }) => {
  const s = document.getElementById("noche");
  const alto = s.offsetHeight - innerHeight;
  const desde = s.offsetTop + (3.7 / total) * alto;
  const hasta = s.offsetTop + (4.5 / total) * alto;
  const t0 = performance.now();
  const cuadros = [];
  const lentosEn = [];
  let previo = t0;
  const paso = (hasta - desde) / 36;
  let y = desde;
  while (performance.now() - t0 < 3600) {
    if (y < hasta) {
      y = Math.min(hasta, y + paso);
      window.scrollTo(0, y);
    }
    await new Promise((r) => requestAnimationFrame(r));
    const ahora = performance.now();
    cuadros.push(Math.round((ahora - previo) * 10) / 10);
    if (ahora - previo > 34) lentosEn.push([Math.round(ahora - t0), Math.round(ahora - previo), s.dataset.pausa]);
    previo = ahora;
  }
  const largas = window.__largas.filter(([t]) => t >= t0);
  const orden = [...cuadros].sort((a, b) => a - b);
  const p = (q) => orden[Math.floor(orden.length * q)];
  return { cuadros: cuadros.length, p50: p(0.5), p95: p(0.95), max: orden[orden.length - 1], lentos: cuadros.filter((c) => c > 34).length, lentosEn, largas, pausa: s.dataset.pausa };
}, { total: PANTALLAS });
const r = await medir;
console.log(JSON.stringify({ etiqueta: ETIQUETA, gpu, ...r }));

// Segundo pase, sin CPU lenta: capturas a media animación del cierre.
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
await ir(3.7);
await pagina.waitForTimeout(3500);
await ir(4.5);
let antes = 0;
for (const [ms, nombre] of [[500, "a"], [900, "b"], [1300, "c"], [1700, "d"], [2600, "e"]]) {
  await pagina.waitForTimeout(ms - antes);
  antes = ms;
  await pagina.screenshot({ path: `${SALIDA}/${ETIQUETA}-${nombre}.png` });
}
await navegador.close();
