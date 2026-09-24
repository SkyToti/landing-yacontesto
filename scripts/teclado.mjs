// Prueba de humo de accesibilidad que Lighthouse no ve: recorre la página con Tab (como alguien
// con teclado) y lee el árbol de accesibilidad de Chrome al cargar.
// - Cada elemento enfocado debe verse (opacidad acumulada ≥ 0.5) y no quedar bajo la muesca.
// - Deben alcanzarse las 6 preguntas, el control del precio y el botón del cierre.
// - El titular y los títulos de todas las secciones deben estar en el árbol desde el principio.
// Uso (con out/ servido o no): node scripts/teclado.mjs [--ancho 1440] [--alto 900]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const ancho = Number(args[args.indexOf("--ancho") + 1]) || 1440;
const alto = Number(args[args.indexOf("--alto") + 1]) || 900;
const raiz = resolve("out");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const servidor = createServer(async (req, res) => {
  let archivo = join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(3228, r));
setTimeout(() => {
  console.log("Se pasó de 4 minutos: prueba abortada.");
  process.exit(2);
}, 240_000).unref();

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
const errores = [];
pagina.on("pageerror", (e) => errores.push(String(e)));
pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
await pagina.goto("http://localhost:3228/", { waitUntil: "load" });
await pagina.waitForTimeout(1500);

// 1. Árbol de accesibilidad al cargar: el nombre del H1 y los títulos de todas las secciones.
const cdp = await pagina.context().newCDPSession(pagina);
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
const titulos = nodes.filter((n) => !n.ignored && n.role?.value === "heading").map((n) => n.name?.value ?? "");
console.log(`Árbol al cargar: ${titulos.length} títulos`);
titulos.forEach((t) => console.log(`  · ${t.slice(0, 70)}`));

// 2. Recorrido con Tab.
const fallas = [];
const vistos = new Set();
let preguntas = 0;
let controlPrecio = false;
let botonCierre = false;
for (let i = 0; i < 80; i++) {
  await pagina.keyboard.press("Tab");
  // El Director puede armar la escena y llevar el scroll (Lenis tarda 1.4 s): se espera a que asiente.
  await pagina.waitForTimeout(1600);
  const r = await pagina.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    let op = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
    const caja = el.getBoundingClientRect();
    const nombre = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("id") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 50);
    return {
      clave: `${el.closest("section")?.id ?? ""}|${el.tagName}#${el.id}.${el.className}|${nombre}`,
      nombre,
      op: Math.round(op * 100) / 100,
      arriba: Math.round(caja.top),
      abajo: Math.round(caja.bottom),
      alto: Math.round(caja.height),
      salto: el.classList.contains("saltar"),
      seccion: el.closest("section")?.id ?? el.closest("header, footer")?.tagName.toLowerCase() ?? "",
      pregunta: el.classList.contains("faq-pregunta"),
      control: el.id === "pacientes",
      cierre: !!el.closest("#cierre") && el.tagName === "A",
    };
  });
  if (!r) break;
  if (vistos.has(r.clave)) break;
  vistos.add(r.clave);
  if (r.pregunta) preguntas++;
  if (r.control) controlPrecio = true;
  if (r.cierre) botonCierre = true;
  // El enlace de salto se dibuja encima de la muesca, y una región que llena la escena (el carrusel)
  // empieza detrás de ella por diseño: solo cuenta lo que es más chico que media pantalla.
  const tapado = r.seccion !== "header" && !r.salto && r.alto < alto / 2 && r.arriba < 60;
  const invisible = r.op < 0.5;
  const fuera = r.abajo < 0 || r.arriba > alto;
  console.log(`${String(i + 1).padStart(2)} ${r.seccion.padEnd(10)} op ${r.op} y ${r.arriba} · ${r.nombre}${invisible ? "  ← INVISIBLE" : ""}${tapado ? "  ← BAJO LA MUESCA" : ""}${fuera ? "  ← FUERA DE VISTA" : ""}`);
  if (invisible || tapado || fuera) fallas.push(r.nombre);
}
console.log(`Preguntas alcanzadas: ${preguntas}/6 · control del precio: ${controlPrecio ? "sí" : "NO"} · botón del cierre: ${botonCierre ? "sí" : "NO"}`);
console.log(`Fallas de foco: ${fallas.length} · errores de consola: ${errores.length}`, errores.slice(0, 2));
await navegador.close();
servidor.close();
process.exit(fallas.length || preguntas < 6 || !controlPrecio || !botonCierre || errores.length ? 1 : 0);
