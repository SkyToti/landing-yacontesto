// Recorre la escena de las 23:47 (rama r1-moli) pausa por pausa y toma una captura de cada una.
// Perfiles: iPhone 13 con y sin barras de Safari (390 × 844 y 390 × 664) y escritorio (1280 × 800),
// más la versión quieta (prefers-reduced-motion) en celular y escritorio.
// Uso: node scripts/r1-escena.mjs [URL] [carpeta]   (por omisión http://localhost:3100/ y investigacion/r1-capturas)
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3100/";
const SALIDA = process.argv[3] ?? "investigacion/r1-capturas";
// Las mismas pausas que components/consultorio/noche/director.ts (en pantallas de scroll).
const PANTALLAS = 4.75;
const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5];
// Lo que pasa a media pausa y no queda en el reposo: la lupa sobre las 10:00 (P2) y el lápiz escribiendo (P4).
const ACCION = { 2: 1700, 4: 1750 };
const ESPERA = { 0: 900, 2: 4300, 4: 3700 };

const PERFILES = [
  { nombre: "movil-844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nombre: "movil-664", viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nombre: "escritorio", viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const errores = [];

async function abrir(perfil, quieto) {
  const { nombre, ...opciones } = perfil;
  const contexto = await navegador.newContext({ ...opciones, reducedMotion: quieto ? "reduce" : "no-preference" });
  const pagina = await contexto.newPage();
  pagina.on("console", (m) => m.type() === "error" && errores.push(`${nombre}${quieto ? " quieto" : ""}: ${m.text()}`));
  pagina.on("pageerror", (e) => errores.push(`${nombre}${quieto ? " quieto" : ""}: ${e.message}`));
  await pagina.goto(URL, { waitUntil: "networkidle" });
  return { contexto, pagina };
}

for (const perfil of PERFILES) {
  const { contexto, pagina } = await abrir(perfil, false);
  await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
  await pagina.waitForTimeout(2600); // lo que pasa solo al abrir: la luz, la notificación, la nota
  for (let k = 0; k < PAUSAS.length; k++) {
    await pagina.evaluate(
      ({ p, total }) => {
        const s = document.getElementById("noche");
        window.scrollTo(0, s.offsetTop + (p / total) * (s.offsetHeight - innerHeight));
      },
      { p: PAUSAS[k], total: PANTALLAS },
    );
    if (ACCION[k]) {
      await pagina.waitForTimeout(ACCION[k]);
      await pagina.screenshot({ path: `${SALIDA}/${perfil.nombre}-P${k}-accion.png` });
    }
    await pagina.waitForTimeout((ESPERA[k] ?? 3400) - (ACCION[k] ?? 0));
    const estado = await pagina.evaluate(() => ({
      pausa: document.getElementById("noche").dataset.pausa,
      ancho: document.documentElement.scrollWidth,
    }));
    if (estado.pausa !== String(k)) errores.push(`${perfil.nombre}: en P${k} el director dice P${estado.pausa}`);
    if (estado.ancho > perfil.viewport.width) errores.push(`${perfil.nombre} P${k}: scroll horizontal (${estado.ancho} px)`);
    await pagina.screenshot({ path: `${SALIDA}/${perfil.nombre}-P${k}.png` });
    console.log(`${perfil.nombre} P${k} ✓`);
  }
  await contexto.close();
}

for (const perfil of [PERFILES[0], PERFILES[2]]) {
  const { contexto, pagina } = await abrir(perfil, true);
  const cine = await pagina.evaluate(() => document.documentElement.classList.contains("cine"));
  if (cine) errores.push(`${perfil.nombre} quieto: con movimiento reducido la escena no debe contarse con scroll`);
  await pagina.screenshot({ path: `${SALIDA}/${perfil.nombre}-quieto.png`, fullPage: true });
  console.log(`${perfil.nombre} quieto ✓`);
  await contexto.close();
}

await navegador.close();
if (errores.length) {
  console.log(`\n${errores.length} problema(s):\n- ${errores.join("\n- ")}`);
  process.exitCode = 1;
} else console.log("\nSin errores de consola ni de página.");
