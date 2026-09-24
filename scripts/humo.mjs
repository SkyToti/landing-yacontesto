// Prueba de humo contra una vista previa publicada: carga, errores, recursos caídos y recorrido
// completo hasta el pie, en WebKit y Chromium (celular y PC).
// Uso: node scripts/humo.mjs [url]   (por omisión, https://yacontesto-rediseno.vercel.app/)
import { chromium, webkit } from "playwright";

const url = process.argv[2] || "https://yacontesto-rediseno.vercel.app/";
const casos = [
  ["webkit", 390, 664],
  ["chromium", 390, 664],
  ["chromium", 1440, 900],
];
let malos = 0;
for (const [motor, ancho, alto] of casos) {
  const navegador = await (motor === "webkit" ? webkit : chromium).launch();
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  pagina.on("pageerror", (e) => errores.push("js: " + String(e).slice(0, 120)));
  pagina.on("console", (m) => m.type() === "error" && errores.push("consola: " + m.text().slice(0, 120)));
  pagina.on("response", (r) => r.status() >= 400 && errores.push(`${r.status()} ${r.url().slice(0, 100)}`));
  pagina.on("requestfailed", (r) => errores.push(`falló ${r.url().slice(0, 100)}`));
  const t0 = Date.now();
  await pagina.goto(url, { waitUntil: "load" });
  const carga = Date.now() - t0;
  await pagina.waitForTimeout(2500);
  const altoTotal = await pagina.evaluate(() => document.documentElement.scrollHeight);
  // Con scrollTo por tramos: la rueda y el gesto táctil sintéticos se cuelgan en móvil.
  for (let y = 0; y <= altoTotal; y += Math.round(alto / 3)) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(90);
  }
  await pagina.waitForTimeout(1500);
  const fin = await pagina.evaluate(() => {
    const pie = document.querySelector("footer")?.getBoundingClientRect();
    return { pie: !!pie && pie.top < innerHeight && pie.bottom > 0, preguntas: document.querySelectorAll(".faq-pregunta").length };
  });
  const ok = !errores.length && fin.pie && fin.preguntas === 6;
  if (!ok) malos++;
  console.log(`${motor} ${ancho}×${alto}: carga ${carga} ms · alto ${altoTotal} px · pie a la vista: ${fin.pie ? "sí" : "NO"} · preguntas: ${fin.preguntas} · errores: ${errores.length}`, errores.slice(0, 3));
  await navegador.close();
}
process.exit(malos ? 1 : 0);
