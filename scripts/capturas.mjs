// Capturas escena por escena con Playwright, y revisión de cortes, desbordes y texto encimado.
//
// Uso (después de `npm run build`):
//   node scripts/capturas.mjs                       → WebKit y Chromium, 390×844 y 1440×900, cine y quieto
//   node scripts/capturas.mjs --motor webkit --tam 390x844 --modo cine
// Las capturas van a investigacion/capturas/ (fuera de git). Sale con código 1 si algo falla.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium, webkit } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const motores = (args.motor ?? "webkit,chromium").split(",");
const tamanos = (args.tam ?? "390x844,1440x900").split(",").map((t) => t.split("x").map(Number));
const modos = (args.modo ?? "cine,quieto").split(",");
const raizOut = resolve("out");
const salida = resolve(args.salida ?? "investigacion/capturas");
const PUERTO = Number(args.puerto ?? 3210);

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".txt": "text/plain" };

const servidor = createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let archivo = join(raizOut, ruta);
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) {
    res.writeHead(404);
    return res.end("404");
  }
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  res.end(await readFile(archivo));
});
await new Promise((r) => servidor.listen(PUERTO, r));

// Revisión dentro de la página: desborde horizontal, texto cortado por los bordes y texto encimado.
function revisar() {
  const hallazgos = [];
  const ancho = innerWidth;
  const alto = innerHeight;
  if (document.documentElement.scrollWidth > ancho + 1) hallazgos.push(`desborde horizontal: ${document.documentElement.scrollWidth}px > ${ancho}px`);
  // Lo visible de un texto: sus renglones de texto, recortados por los ancestros que recortan,
  // y solo si la opacidad acumulada es alta. Así no cuentan las palabras escondidas en su máscara.
  const cajaVisible = (el) => {
    if (el.closest("[aria-hidden='true'], .tambor-escena, .tel, .dp-rejilla, .mini, .grafica, .solo-lectores")) return null;
    // Cada renglón cuenta solo si él y todos sus ancestros se ven (opacidad acumulada ≥ 0.6).
    const seVe = (nodo) => {
      let op = 1;
      for (let n = nodo.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        op *= Number(cs.opacity);
      }
      return op >= 0.6;
    };
    const recorte = (r) => {
      let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
      for (let n = r.nodo.parentElement; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.overflow !== "visible" || cs.clipPath !== "none") {
          const c = n.getBoundingClientRect();
          x1 = Math.max(x1, c.left); y1 = Math.max(y1, c.top); x2 = Math.min(x2, c.right); y2 = Math.min(y2, c.bottom);
        }
      }
      return x2 - x1 > 1 && y2 - y1 > 1 ? { left: x1, top: y1, right: x2, bottom: y2 } : null;
    };
    const cajas = [];
    const recorrer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = recorrer.nextNode(); t; t = recorrer.nextNode()) {
      if (!t.textContent.trim() || !seVe(t)) continue;
      const rango = document.createRange();
      rango.selectNodeContents(t);
      for (const r of rango.getClientRects()) {
        const v = recorte({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, nodo: t });
        if (v) cajas.push(v);
      }
    }
    if (!cajas.length) return null;
    const u = { left: Math.min(...cajas.map((c) => c.left)), top: Math.min(...cajas.map((c) => c.top)), right: Math.max(...cajas.map((c) => c.right)), bottom: Math.max(...cajas.map((c) => c.bottom)) };
    if (u.bottom < 64 || u.top > alto || u.right < 0 || u.left > ancho) return null;
    return u;
  };
  const textos = [...document.querySelectorAll("h1, h2, h3, main p, .nota, .boton, .faq-pregunta, .paso-cuando, .tj-hora, .pie p")]
    .map((el) => ({ el, r: cajaVisible(el) }))
    .filter((x) => x.r);
  for (const { el, r } of textos) {
    if (r.left < -1 || r.right > ancho + 1) hallazgos.push(`cortado en el borde: «${el.textContent.trim().slice(0, 40)}» (${Math.round(r.left)}–${Math.round(r.right)})`);
  }
  for (let i = 0; i < textos.length; i++) {
    for (let j = i + 1; j < textos.length; j++) {
      const a = textos[i].el;
      const b = textos[j].el;
      if (a.contains(b) || b.contains(a)) continue;
      const ra = textos[i].r;
      const rb = textos[j].r;
      const x = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
      const y = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
      const menor = Math.min((ra.right - ra.left) * (ra.bottom - ra.top), (rb.right - rb.left) * (rb.bottom - rb.top));
      if (x * y > menor * 0.12) hallazgos.push(`encimados: «${a.textContent.trim().slice(0, 30)}» y «${b.textContent.trim().slice(0, 30)}»`);
    }
  }
  return hallazgos;
}

let fallas = 0;
const informe = [];
for (const motor of motores) {
  const navegador = await (motor === "webkit" ? webkit : chromium).launch();
  for (const [w, h] of tamanos) {
    for (const modo of modos) {
      const movil = w < 900;
      const contexto = await navegador.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: movil ? 2 : 1,
        isMobile: movil && motor !== "webkit" ? true : undefined,
        hasTouch: movil,
        reducedMotion: modo === "quieto" ? "reduce" : "no-preference",
      });
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
      pagina.on("pageerror", (e) => errores.push(String(e)));
      await pagina.goto(`http://localhost:${PUERTO}/`, { waitUntil: "load" });
      await pagina.evaluate(() => document.fonts.ready);
      const carpeta = join(salida, `${motor}-${w}x${h}-${modo}`);
      await mkdir(carpeta, { recursive: true });
      const hallazgos = [];
      if (modo === "cine") {
        await pagina.evaluate(() => window.scrollTo(0, 1));
        await pagina.waitForFunction(() => window.__historiaLista === true, null, { timeout: 30000 });
        await pagina.evaluate(() => window.__historia.construirTodo());
        const puntos = await pagina.evaluate(() => window.__historia.puntos());
        for (const p of puntos) {
          await pagina.evaluate((y) => window.scrollTo(0, y), p.y);
          await pagina.waitForTimeout(1300);
          const r = await pagina.evaluate(revisar);
          r.forEach((x) => hallazgos.push(`${p.nombre}: ${x}`));
          await pagina.screenshot({ path: join(carpeta, `${p.nombre}.png`) });
        }
      } else {
        await pagina.waitForTimeout(600);
        const secciones = await pagina.evaluate(() => [...document.querySelectorAll("main > section, footer")].map((s) => ({ id: s.id || s.tagName.toLowerCase(), y: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight })));
        let n = 1;
        for (const s of secciones) {
          for (let y = s.y; y < s.y + s.h - 40; y += h * 0.9) {
            await pagina.evaluate((yy) => window.scrollTo(0, yy), y);
            await pagina.waitForTimeout(250);
            const r = await pagina.evaluate(revisar);
            r.forEach((x) => hallazgos.push(`${s.id}: ${x}`));
            await pagina.screenshot({ path: join(carpeta, `${String(n++).padStart(2, "0")}-${s.id}.png`) });
          }
        }
      }
      const unicos = [...new Set(hallazgos)];
      informe.push({ motor, tamano: `${w}x${h}`, modo, errores, hallazgos: unicos });
      if (errores.length || unicos.length) fallas++;
      console.log(`${motor} ${w}x${h} ${modo}: ${errores.length} errores de consola, ${unicos.length} hallazgos`);
      unicos.forEach((x) => console.log("  - " + x));
      errores.forEach((x) => console.log("  ! " + x.slice(0, 200)));
      await contexto.close();
    }
  }
  await navegador.close();
}
await writeFile(join(salida, "informe.json"), JSON.stringify(informe, null, 2));
servidor.close();
process.exit(fallas ? 1 : 0);
