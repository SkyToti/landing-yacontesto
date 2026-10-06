// Recorre la escena de las 23:47 con el scroll, con la CPU 4× más lenta, y cuenta las tareas largas
// del hilo principal (> 50 ms). Sin GPU en Chromium sin ventana: los cuadros no representan un
// celular, pero las tareas largas (lo que traba el pulgar) sí.
// Uso (con `npm run start` o el servidor de out/ en marcha): node scripts/r1-scroll.mjs [URL]
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pagina = await contexto.newPage();
const cdp = await contexto.newCDPSession(pagina);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await pagina.addInitScript(() => {
  window.__largas = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__largas.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
});
await pagina.goto(URL, { waitUntil: "networkidle" });
await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
await pagina.waitForTimeout(3000);
const r = await pagina.evaluate(async () => {
  const s = document.getElementById("noche");
  const fin = s.offsetTop + s.offsetHeight - innerHeight;
  const t0 = performance.now();
  const cuadros = [];
  let y = 0;
  let previo = performance.now();
  // Un pulgar que baja parejo: ~12 px por cuadro, con un tope de 25 s por si algo se cuelga.
  while (y < fin && performance.now() - t0 < 25000) {
    y = Math.min(fin, y + 12);
    window.scrollTo(0, y);
    await new Promise((res) => requestAnimationFrame(res));
    const ahora = performance.now();
    cuadros.push(ahora - previo);
    previo = ahora;
  }
  await new Promise((res) => setTimeout(res, 3500));
  const largas = window.__largas.filter(([t]) => t >= t0);
  cuadros.sort((a, b) => a - b);
  const p = (q) => Math.round(cuadros[Math.floor(cuadros.length * q)]);
  return { recorrido: Math.round(fin), segundos: ((performance.now() - t0) / 1000).toFixed(1), cuadros: cuadros.length, p50: p(0.5), p95: p(0.95), largas, pausaFinal: s.dataset.pausa };
});
console.log(JSON.stringify(r));
await navegador.close();
