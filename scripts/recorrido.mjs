// El recorrido de la historia fotograma a fotograma, como lo ve quien hace scroll (R-PULIDO).
//
// capturas.mjs mira 21 puntos quietos; esto mira lo que pasa ENTRE ellos:
//   barrido  → un fotograma cada tramo de scroll (más fino en cada cambio de sección), con métricas
//              del DOM por fotograma (texto encimado, a medias, cortado, cuadro vacío) y, después,
//              brincos, parpadeos, energía de movimiento (tramos muertos y cortes) y hojas de contacto.
//   tiempo   → fotogramas reales a ~30 fps (screencast de Chromium) mientras se recorre a velocidad
//              de lectura: lo que depende del tiempo (morph, cilindro, suavizado, cuadros perdidos).
//   safari   → el iPhone con y sin las barras de Safari: ¿algo brinca cuando cambia el alto?
//
// Uso (después de `npm run build`):
//   node scripts/recorrido.mjs                               → perfiles finos, barrido + tiempo + safari
//   node scripts/recorrido.mjs --perfiles todos --modos barrido
//   node scripts/recorrido.mjs --perfiles iphone13 --escena amanece --corrida despues
//   node scripts/recorrido.mjs --comparar antes,despues --perfiles iphone13 --escena amanece
//   node scripts/recorrido.mjs --url https://yacontesto-rediseno.vercel.app --perfiles pc-1440
// Todo va a investigacion/recorrido/<corrida>/<perfil>/ (fuera de git).
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium, webkit } from "playwright";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] ?? ""]] : acc), []),
);

// ── Perfiles ─────────────────────────────────────────────────────────────────
// alto: el alto de escena que tendría Safari (100svh = con las barras visibles), fijado a mano
// porque Playwright no simula las barras: con la ventana más alta que eso, es el iPhone con las
// barras escondidas. tactil: sin hover ni puntero fino (en un iPhone real, Lenis no se activa).
const PERFILES = {
  iphone13: { motor: "webkit", w: 390, h: 664, dpr: 2, tactil: true, alto: 664, fino: true, nota: "iPhone 13 de Diego, con las barras de Safari" },
  "iphone13-sin-barras": { motor: "webkit", w: 390, h: 750, dpr: 2, tactil: true, alto: 664, nota: "iPhone 13 con las barras escondidas (svh sigue en 664)" },
  "iphone-se": { motor: "webkit", w: 375, h: 553, dpr: 2, tactil: true, alto: 553, nota: "iPhone SE 2.ª/3.ª gen con barras (aprox.)" },
  w320: { motor: "webkit", w: 320, h: 568, dpr: 2, tactil: true, nota: "320 px, el ancho mínimo de WCAG" },
  pixel7: { motor: "chromium", w: 412, h: 839, dpr: 2, tactil: true, movil: true, nota: "Pixel 7 con Chrome" },
  "movil-horizontal": { motor: "webkit", w: 750, h: 342, dpr: 2, tactil: true, nota: "iPhone 13 en horizontal: cae en la versión quieta" },
  "ipad-vertical": { motor: "webkit", w: 834, h: 1120, dpr: 1, tactil: true, alto: 1120, fino: true, nota: "iPad Pro 11 de Diego, vertical, con barras (aprox.)" },
  "ipad-horizontal": { motor: "webkit", w: 1194, h: 760, dpr: 1, tactil: true, alto: 760, fino: true, nota: "iPad Pro 11 de Diego, horizontal, con barras (aprox.)" },
  "ipad-gen7": { motor: "webkit", w: 810, h: 1080, dpr: 1, tactil: true, nota: "iPad (gen 7), vertical" },
  "pc-1280": { motor: "chromium", w: 1280, h: 720, dpr: 1, nota: "laptop chica" },
  "pc-1440": { motor: "chromium", w: 1440, h: 900, dpr: 1, fino: true, nota: "PC principal" },
  "pc-1920": { motor: "chromium", w: 1920, h: 1080, dpr: 1, nota: "monitor grande" },
  "edge-1440": { motor: "msedge", w: 1440, h: 900, dpr: 1, nota: "Microsoft Edge real" },
  "quieto-iphone13": { motor: "webkit", w: 390, h: 664, dpr: 2, tactil: true, quieto: true, nota: "iPhone 13 con movimiento reducido" },
  "quieto-pc-1440": { motor: "chromium", w: 1440, h: 900, dpr: 1, quieto: true, nota: "PC con movimiento reducido" },
};
// El tiempo real va en Chromium (el screencast es de CDP): mismo tamaño que el perfil de WebKit.
const TIEMPO = ["iphone13", "ipad-vertical", "ipad-horizontal", "pc-1440"];

const grupo = args.perfiles || "finos";
const nombres =
  grupo === "todos" ? Object.keys(PERFILES) : grupo === "finos" ? Object.keys(PERFILES).filter((n) => PERFILES[n].fino) : grupo.split(",");
for (const n of nombres) if (!PERFILES[n]) throw new Error(`No existe el perfil «${n}». Hay: ${Object.keys(PERFILES).join(", ")}`);
const modos = (args.modos || "barrido,tiempo,safari").split(",");
const corrida = args.corrida || "antes";
const raizSalida = resolve(args.salida || "investigacion/recorrido");
const soloEscena = args.escena || null;

// ── Servidor de out/ (o una URL publicada) ─────────────────────────────────
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".txt": "text/plain" };
let servidor = null;
let base = args.url || "";
if (!base && !args.comparar && !("reanalizar" in args)) {
  const raizOut = resolve("out");
  if (!existsSync(raizOut)) throw new Error("No hay out/: corre primero npm run build");
  servidor = createServer(async (req, res) => {
    let archivo = join(raizOut, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
    if (!existsSync(archivo)) return res.writeHead(404).end("404");
    res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
    res.end(await readFile(archivo));
  });
  const puerto = Number(args.puerto) || 3230;
  await new Promise((r) => servidor.listen(puerto, r));
  base = `http://localhost:${puerto}/`;
}
setTimeout(() => {
  console.log("Se pasó de 90 minutos: recorrido abortado.");
  process.exit(2);
}, 90 * 60_000).unref();

// ── Scripts que corren dentro de la página ─────────────────────────────────
// Sin hover ni puntero fino: como un iPhone o un iPad de verdad (la historia no enciende Lenis).
function sinHoverFino() {
  const original = window.matchMedia.bind(window);
  window.matchMedia = (q) => {
    if (/hover:\s*hover|pointer:\s*fine/.test(q)) {
      return { matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false };
    }
    return original(q);
  };
}

// El alto de escena de Safari: 100svh es el alto con las barras visibles y no cambia al esconderlas.
function altoFijo(px) {
  const poner = () => {
    const s = document.createElement("style");
    s.textContent = `:root{--alto:${px}px !important}`;
    document.documentElement.appendChild(s);
  };
  if (document.documentElement) poner();
  else document.addEventListener("readystatechange", poner, { once: true });
}

function leerMapa() {
  const secciones = [...document.querySelectorAll("main > section")].map((s) => ({
    id: s.id,
    top: Math.round(s.getBoundingClientRect().top + scrollY),
    alto: s.offsetHeight,
  }));
  const pie = document.querySelector("footer");
  if (pie) secciones.push({ id: "pie", top: Math.round(pie.getBoundingClientRect().top + scrollY), alto: pie.offsetHeight });
  const m = document.querySelector("[data-muesca]")?.getBoundingClientRect();
  return {
    secciones,
    puntos: window.__historia?.puntos?.() ?? [],
    cine: document.documentElement.classList.contains("cine"),
    total: document.documentElement.scrollHeight,
    vw: innerWidth,
    vh: innerHeight,
    muesca: m ? { top: m.top, bottom: m.bottom, left: m.left, right: m.right } : null,
  };
}

// Marca lo que se sigue fotograma a fotograma: los textos (fuera de las ilustraciones) y las
// ilustraciones (teléfonos, cartas de los cilindros, reloj, agenda, tarjetas).
function marcar() {
  const dentroDeIlustracion =
    "[aria-hidden='true'], .tambor-escena, [id^='tel-'], .dp-rejilla, .mini, .grafica, .solo-lectores, .diagonal-ventana, .dia-agenda, .vuelo, .ruta-guia";
  const textos = [
    ...document.querySelectorAll(
      "h1, h2, h3, main p, .nota, .boton, .faq-pregunta, .paso-cuando, .paso-que, .tj-hora, .pie p, .etiqueta-ficticia, .muesca-precio-movil",
    ),
  ].filter((el) => !el.closest(dentroDeIlustracion) && !el.closest("header"));
  // Un texto dentro de otro texto marcado (p dentro de .nota) se mide con su contenedor.
  const unicos = textos.filter((el) => !textos.some((o) => o !== el && o.contains(el)));
  const ilus = [
    ...document.querySelectorAll(
      "#tel-noche, #tel-equipo, .tambor-portada .tambor-carta, .vuelo, [data-reloj-grande], [data-arco], .dia-agenda, .diagonal-ventana, .dia-rejilla .mini, .ruta, .precio-tarjeta, .faq-item, .tambor-cierre .tambor-carta",
    ),
  ];
  const etiqueta = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34);
  const seccion = (el) => el.closest("section, footer")?.id || (el.closest("footer") ? "pie" : "");
  const claves = {};
  unicos.forEach((el, i) => {
    el.dataset.rk = `t${i}`;
    claves[`t${i}`] = { tipo: "texto", seccion: seccion(el), etiqueta: etiqueta(el), fijo: !!el.closest(".escena") };
  });
  ilus.forEach((el, i) => {
    el.dataset.rk = `i${i}`;
    // En un SVG, className no es texto (SVGAnimatedString): se lee el atributo.
    claves[`i${i}`] = { tipo: "ilus", seccion: seccion(el), etiqueta: el.id || (el.getAttribute("class") || "").split(" ")[0], fijo: !!el.closest(".escena") };
  });
  return claves;
}

// Espera a que el scrub (y Lenis) terminen de alcanzar el scroll: la firma de los estilos que
// escribe GSAP deja de cambiar. Tope: 1.6 s (al principio el cilindro gira solo 2.8 s).
async function asentar({ minimo, maximo }) {
  const firma = () => {
    let s = String(scrollY);
    for (const el of document.querySelectorAll("main [style], header [style]")) s += el.getAttribute("style");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  };
  const cuadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const t0 = performance.now();
  await cuadro();
  await new Promise((r) => setTimeout(r, minimo));
  let antes = firma();
  let quietos = 0;
  while (performance.now() - t0 < maximo) {
    await new Promise((r) => setTimeout(r, 60));
    const ahora = firma();
    quietos = ahora === antes ? quietos + 1 : 0;
    antes = ahora;
    if (quietos >= 2) break;
  }
  await cuadro();
  return Math.round(performance.now() - t0);
}

// Las métricas de un fotograma, sobre lo que de verdad se dibuja: renglones de texto recortados
// por sus ancestros que recortan, con la opacidad acumulada de cada uno.
function medir() {
  const vw = innerWidth;
  const vh = innerHeight;
  const muesca = document.querySelector("[data-muesca]")?.getBoundingClientRect();
  const limiteArriba = muesca ? muesca.bottom : 0;
  const opDe = (el) => {
    let op = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      op *= Number(cs.opacity);
    }
    return op;
  };
  const recortar = (r, desde) => {
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    for (let n = desde; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflow !== "visible" || cs.clipPath !== "none") {
        const c = n.getBoundingClientRect();
        x1 = Math.max(x1, c.left); y1 = Math.max(y1, c.top); x2 = Math.min(x2, c.right); y2 = Math.min(y2, c.bottom);
      }
    }
    return x2 - x1 > 1 && y2 - y1 > 1 ? [x1, y1, x2, y2] : null;
  };
  const textos = [];
  for (const el of document.querySelectorAll("[data-rk^='t']")) {
    const cajas = [];
    let opMax = 0;
    const paso = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = paso.nextNode(); t; t = paso.nextNode()) {
      if (!t.textContent.trim()) continue;
      // Una respuesta cerrada del FAQ sigue maquetada en Chromium (recortada a alto 0 por
      // ::details-content, que este recorrido no ve): no se dibuja, así que no cuenta.
      if (t.parentElement.closest("details:not([open]) > :not(summary)")) continue;
      const op = opDe(t.parentElement);
      if (op < 0.05) continue;
      const rango = document.createRange();
      rango.selectNodeContents(t);
      for (const r of rango.getClientRects()) {
        const v = recortar(r, t.parentElement);
        if (v) {
          cajas.push(v);
          opMax = Math.max(opMax, op);
        }
      }
    }
    if (!cajas.length) continue;
    const u = [Math.min(...cajas.map((c) => c[0])), Math.min(...cajas.map((c) => c[1])), Math.max(...cajas.map((c) => c[2])), Math.max(...cajas.map((c) => c[3]))];
    if (u[3] < 0 || u[1] > vh || u[2] < 0 || u[0] > vw) continue;
    // Anclado: su escena está pegada arriba (fija). Al soltarse, pasar bajo la muesca es normal.
    const escena = el.closest(".escena");
    const anclado = !!escena && document.documentElement.classList.contains("cine") && Math.abs(escena.getBoundingClientRect().top) < 1.5;
    const areaVisible = cajas.reduce((s, c) => s + Math.max(0, Math.min(c[2], vw) - Math.max(c[0], 0)) * Math.max(0, Math.min(c[3], vh) - Math.max(c[1], limiteArriba)), 0);
    textos.push({ k: el.dataset.rk, op: Math.round(opMax * 100) / 100, r: u.map(Math.round), fijo: !!escena, anclado, area: Math.round((areaVisible / (vw * vh)) * 1000) / 1000 });
  }
  const ilus = [];
  for (const el of document.querySelectorAll("[data-rk^='i']")) {
    const op = opDe(el);
    if (op < 0.05) continue;
    const r = el.getBoundingClientRect();
    const v = recortar({ left: r.left, top: r.top, right: r.right, bottom: r.bottom }, el.parentElement);
    if (!v) continue;
    const x = Math.max(0, Math.min(v[2], vw) - Math.max(v[0], 0));
    const y = Math.max(0, Math.min(v[3], vh) - Math.max(v[1], limiteArriba));
    if (x * y <= 0) continue;
    ilus.push({ k: el.dataset.rk, op: Math.round(op * 100) / 100, r: v.map(Math.round), area: Math.round(((x * y) / (vw * vh)) * 1000) / 1000 });
  }
  const area = (r) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
  const cruce = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const encimados = [];
  for (let i = 0; i < textos.length; i++) {
    for (let j = i + 1; j < textos.length; j++) {
      const a = textos[i];
      const b = textos[j];
      if (a.op < 0.15 || b.op < 0.15) continue;
      const ea = document.querySelector(`[data-rk='${a.k}']`);
      const eb = document.querySelector(`[data-rk='${b.k}']`);
      if (ea.contains(eb) || eb.contains(ea)) continue;
      if (cruce(a.r, b.r) > Math.min(area(a.r), area(b.r)) * 0.12) {
        encimados.push({ a: a.k, b: b.k, duro: a.op >= 0.6 && b.op >= 0.6 });
      }
    }
  }
  const sobreIlus = [];
  for (const t of textos) {
    if (t.op < 0.6) continue;
    for (const il of ilus) {
      if (il.op < 0.6) continue;
      const et = document.querySelector(`[data-rk='${t.k}']`);
      const ei = document.querySelector(`[data-rk='${il.k}']`);
      if (ei.contains(et)) continue;
      if (cruce(t.r, il.r) > area(t.r) * 0.25) sobreIlus.push({ texto: t.k, ilus: il.k });
    }
  }
  const legibles = textos.filter((t) => t.op >= 0.8 && t.r[1] >= limiteArriba - 2 && t.r[3] <= vh + 2).length;
  const ilusVisible = ilus.filter((i) => i.op >= 0.6).reduce((s, i) => s + i.area, 0);
  // Cuánta pantalla ocupa lo que se puede leer o ver (una leyenda chica sola no cuenta).
  const contenido = ilusVisible + textos.filter((t) => t.op >= 0.8).reduce((s, t) => s + t.area * 1.6, 0);
  const cortados = [];
  for (const t of textos) {
    if (t.op < 0.6) continue;
    if (t.r[0] < -1 || t.r[2] > vw + 1) cortados.push({ k: t.k, donde: "borde" });
    if (t.anclado && muesca && t.r[1] < muesca.bottom - 4 && t.r[3] > muesca.top + 4 && t.r[2] > muesca.left && t.r[0] < muesca.right) cortados.push({ k: t.k, donde: "muesca" });
    if (t.anclado && t.r[1] < vh && t.r[3] > vh + 1) cortados.push({ k: t.k, donde: "abajo" });
  }
  return {
    textos,
    ilus,
    encimados,
    sobreIlus,
    vacio: contenido < 0.04,
    legibles,
    contenido: Math.round(contenido * 1000) / 1000,
    ilusVisible: Math.round(ilusVisible * 1000) / 1000,
    cortados,
    desborde: Math.max(0, document.documentElement.scrollWidth - vw),
  };
}

// ── Utilidades ─────────────────────────────────────────────────────────────
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const miles = (n) => Math.round(n).toLocaleString("es-MX");
const escapar = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function lanzar(motor) {
  if (motor === "webkit") return webkit.launch();
  if (motor === "msedge") return chromium.launch({ channel: "msedge" });
  return chromium.launch();
}

async function abrir(perfil, { forzarChromium = false } = {}) {
  const motor = forzarChromium ? "chromium" : perfil.motor;
  const navegador = await lanzar(motor);
  const contexto = await navegador.newContext({
    viewport: { width: perfil.w, height: perfil.h },
    deviceScaleFactor: forzarChromium ? 1 : perfil.dpr,
    isMobile: motor === "chromium" && (perfil.movil || (forzarChromium && perfil.tactil)) ? true : undefined,
    hasTouch: !!perfil.tactil,
    reducedMotion: perfil.quieto ? "reduce" : "no-preference",
  });
  if (perfil.tactil) await contexto.addInitScript(sinHoverFino);
  if (perfil.alto) await contexto.addInitScript(altoFijo, perfil.alto);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  pagina.on("pageerror", (e) => errores.push(String(e).slice(0, 200)));
  await pagina.goto(base, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  const cine = await pagina.evaluate(() => document.documentElement.classList.contains("cine"));
  if (cine) {
    await pagina.evaluate(() => window.scrollTo(0, 1));
    await pagina.waitForFunction(() => window.__historiaLista === true, null, { timeout: 30000 });
    await pagina.evaluate(() => window.__historia.construirTodo());
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await esperar(400);
  }
  return { navegador, contexto, pagina, errores, cine };
}

// Sección, avance dentro de ella y momento del director para una posición.
function ubicar(mapa, y) {
  let s = mapa.secciones[0];
  for (const x of mapa.secciones) if (x.top <= y + 1) s = x;
  const recorrido = Math.max(1, s.alto - mapa.vh);
  const avance = s.alto > mapa.vh * 1.4 ? (y - s.top) / recorrido : (y - s.top + mapa.vh) / (s.alto + mapa.vh);
  let momento = "";
  for (const p of mapa.puntos) if (p.y <= y + 1) momento = p.nombre;
  return { seccion: s.id, avance: Math.max(0, Math.min(1, avance)), momento };
}

// ── Barrido por posición ───────────────────────────────────────────────────
async function barrido(nombre, perfil) {
  const carpeta = join(raizSalida, corrida, nombre);
  const cuadros = join(carpeta, "cuadros");
  await rm(cuadros, { recursive: true, force: true });
  await mkdir(cuadros, { recursive: true });
  const { navegador, pagina, errores, cine } = await abrir(perfil);
  const mapa = await pagina.evaluate(leerMapa);
  const claves = await pagina.evaluate(marcar);
  const { vh } = mapa;
  const fondo = mapa.total - vh;

  // Posiciones: un paso de pantalla/12 en los finos (1/6 en los generales, 1/2 en la versión
  // quieta) y 1/40 alrededor de cada cambio de sección en los finos.
  const paso = !cine ? vh / 2 : perfil.fino ? vh / 12 : vh / 6;
  const ys = new Set();
  for (let y = 0; y < fondo; y += paso) ys.add(Math.round(y));
  ys.add(fondo);
  if (cine && perfil.fino) {
    for (const s of mapa.secciones.slice(1)) {
      for (let y = s.top - vh * 0.35; y <= s.top + vh * 0.35; y += vh / 40) if (y >= 0 && y <= fondo) ys.add(Math.round(y));
    }
  }
  let posiciones = [...ys].sort((a, b) => a - b);
  if (soloEscena) {
    const s = mapa.secciones.find((x) => x.id === soloEscena);
    if (!s) throw new Error(`No existe la sección «${soloEscena}»`);
    posiciones = posiciones.filter((y) => y >= s.top - vh * 0.4 && y <= s.top + s.alto - vh + vh * 0.4);
  }

  const registros = [];
  const t0 = Date.now();
  for (const [i, y] of posiciones.entries()) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    const espera = cine
      ? await pagina.evaluate(asentar, { minimo: perfil.w >= 900 ? 180 : 120, maximo: 1600 })
      : await pagina.evaluate(asentar, { minimo: 60, maximo: 400 });
    const real = await pagina.evaluate(() => Math.round(scrollY));
    const m = await pagina.evaluate(medir);
    const archivo = `${String(i).padStart(4, "0")}.jpg`;
    await pagina.screenshot({ path: join(cuadros, archivo), type: "jpeg", quality: 80 });
    registros.push({ i, y: real, pedido: y, espera, archivo, ...ubicar(mapa, real), ...m });
  }
  await navegador.close();
  const segundos = Math.round((Date.now() - t0) / 1000);
  const datos = { perfil: nombre, ...perfil, corrida, fecha: new Date().toISOString(), cine, mapa, claves, errores, segundos, registros };
  await analizar(datos, carpeta);
  await writeFile(join(carpeta, "datos.json"), JSON.stringify(datos));
  await hojas(datos, carpeta);
  return datos;
}

// ── Análisis entre fotogramas ─────────────────────────────────────────────
// Medidas de la imagen misma (160 px de ancho, en gris), calibradas con fotogramas conocidos:
//   detalle → parte de la pantalla (sin la franja de la muesca) con bordes o texto: lo que queda
//             al restarle a la imagen su versión desenfocada. Un degradado de fondo no cuenta.
//             Cuadros normales: 9–21 %; vacíos: 0–0.7 %.
//   cambio  → parte de la pantalla que cambia de un fotograma al siguiente. Paso normal: 1–4 %;
//             el cielo que cambia de golpe: 99 %; tramo quieto: 0 %.
//   energia → cuánto cambia la luz en promedio (0–1). El amanecer de golpe: 0.42 en 55 px; un
//             cielo que se funde parejo en media pantalla: ~0.15 por paso.
async function imagenes(carpetaCuadros, archivos) {
  const detalle = [];
  const cambio = [0];
  const energia = [0];
  let previo = null;
  for (const a of archivos) {
    const ruta = join(carpetaCuadros, a);
    const { data, info } = await sharp(ruta).resize(160).grayscale().raw().toBuffer({ resolveWithObject: true });
    const borroso = await sharp(ruta).resize(160).grayscale().blur(2.5).raw().toBuffer();
    const y0 = Math.round(info.height * 0.11);
    let n = 0;
    for (let y = y0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (Math.abs(data[y * info.width + x] - borroso[y * info.width + x]) > 14) n++;
    detalle.push(Math.round((n / ((info.height - y0) * info.width)) * 10000) / 10000);
    if (previo) {
      let c = 0;
      let s = 0;
      const total = Math.min(previo.length, data.length);
      for (let i = 0; i < total; i++) {
        const d = Math.abs(previo[i] - data[i]);
        s += d;
        if (d > 14) c++;
      }
      cambio.push(Math.round((c / total) * 10000) / 10000);
      energia.push(Math.round((s / total / 255) * 10000) / 10000);
    }
    previo = data;
  }
  return { detalle, cambio, energia };
}

async function analizar(datos, carpeta) {
  const { registros, mapa, claves } = datos;
  const vh = mapa.vh;
  const hallazgos = [];
  const tramo = (a, b) => `${miles(a.y)}–${miles(b.y)}`;

  const img = await imagenes(join(carpeta, "cuadros"), registros.map((r) => r.archivo));
  registros.forEach((r, i) => {
    r.detalle = img.detalle[i];
    r.cambio = img.cambio[i];
    r.energia = img.energia[i];
  });

  // Rachas: un criterio que se cumple en fotogramas seguidos y cubre más de cierto scroll.
  const rachas = (cumple, minimo, tipo, detalle) => {
    let inicio = null;
    for (let i = 0; i <= registros.length; i++) {
      const ok = i < registros.length && cumple(registros[i], i);
      if (ok && inicio === null) inicio = i;
      if (!ok && inicio !== null) {
        const a = registros[inicio];
        const b = registros[i - 1];
        if (b.y - a.y >= minimo) hallazgos.push({ tipo, desde: a.i, hasta: b.i, y: tramo(a, b), seccion: a.seccion, momento: a.momento, detalle: detalle?.(a, b) ?? "" });
        inicio = null;
      }
    }
  };
  rachas((r) => r.detalle < 0.015, vh * 0.25, "cuadro-vacio");
  rachas((r) => r.encimados.some((x) => !x.duro), vh * 0.25, "cruce-largo", (a) => a.encimados.filter((x) => !x.duro).map((x) => `${claves[x.a]?.etiqueta} / ${claves[x.b]?.etiqueta}`).join(" · "));
  if (datos.cine) {
    // Tramo muerto: dentro de una escena fija, nada cambia en más de 3/4 de pantalla.
    const fijas = new Set(mapa.secciones.filter((s) => s.alto > vh * 1.4).map((s) => s.id));
    rachas((r, i) => i > 0 && fijas.has(r.seccion) && r.cambio < 0.002 && registros[i - 1].seccion === r.seccion, vh * 0.75, "tramo-muerto");
  }
  for (const r of registros) {
    for (const x of r.encimados.filter((x) => x.duro)) hallazgos.push({ tipo: "encimado", desde: r.i, hasta: r.i, y: miles(r.y), seccion: r.seccion, momento: r.momento, detalle: `${claves[x.a]?.etiqueta} / ${claves[x.b]?.etiqueta}` });
    for (const c of r.cortados) hallazgos.push({ tipo: `cortado-${c.donde}`, desde: r.i, hasta: r.i, y: miles(r.y), seccion: r.seccion, momento: r.momento, detalle: claves[c.k]?.etiqueta });
    if (r.desborde > 0) hallazgos.push({ tipo: "desborde", desde: r.i, hasta: r.i, y: miles(r.y), seccion: r.seccion, detalle: `${r.desborde}px` });
  }
  // Corte brusco: casi toda la imagen cambia en un paso chico.
  registros.forEach((r, i) => {
    if (i === 0) return;
    const dy = r.y - registros[i - 1].y;
    // Corte brusco: en un paso chico la luz de casi toda la pantalla cambia mucho de golpe.
    if (dy > 0 && dy <= vh / 10 && r.cambio > 0.6 && r.energia > 0.25) hallazgos.push({ tipo: "corte-brusco", desde: r.i - 1, hasta: r.i, y: tramo(registros[i - 1], r), seccion: r.seccion, momento: r.momento, detalle: `cambia el ${Math.round(r.cambio * 100)} % de la pantalla (luz ${r.energia}) en ${Math.round(dy)} px` });
  });

  // Por elemento: texto a medias demasiado tiempo, brincos y parpadeos.
  const serie = {};
  registros.forEach((r, i) => {
    for (const x of [...r.textos, ...r.ilus]) (serie[x.k] ??= []).push({ i, y: r.y, op: x.op, top: x.r[1] });
  });
  for (const [k, puntos] of Object.entries(serie)) {
    const c = claves[k];
    if (!c) continue;
    // Consecutivos: si el elemento no aparece en un fotograma, la serie se corta ahí.
    const tramos = [];
    let actual = [];
    for (const p of puntos) {
      if (actual.length && p.i !== actual[actual.length - 1].i + 1) {
        tramos.push(actual);
        actual = [];
      }
      actual.push(p);
    }
    if (actual.length) tramos.push(actual);
    for (const t of tramos) {
      if (c.tipo === "texto") {
        let ini = null;
        for (let j = 0; j <= t.length; j++) {
          const medio = j < t.length && t[j].op >= 0.2 && t[j].op <= 0.8;
          if (medio && ini === null) ini = j;
          if (!medio && ini !== null) {
            if (t[j - 1].y - t[ini].y > vh * 0.5)
              hallazgos.push({ tipo: "texto-a-medias", desde: t[ini].i, hasta: t[j - 1].i, y: `${miles(t[ini].y)}–${miles(t[j - 1].y)}`, seccion: c.seccion, detalle: `${c.etiqueta} (op ${t[ini].op}…${t[j - 1].op})` });
            ini = null;
          }
        }
      }
      for (let j = 1; j < t.length; j++) {
        const a = t[j - 1];
        const b = t[j];
        const dy = b.y - a.y;
        if (a.op > 0.5 && b.op > 0.5 && Math.abs(b.top - a.top) - Math.abs(dy) > vh * 0.3)
          hallazgos.push({ tipo: "brinco", desde: a.i, hasta: b.i, y: `${miles(a.y)}–${miles(b.y)}`, seccion: c.seccion, detalle: `${c.etiqueta}: ${Math.round(a.top)}→${Math.round(b.top)} px` });
      }
      for (let j = 1; j < t.length - 1; j++) {
        const a = t[j - 1];
        const b = t[j];
        for (let z = j + 1; z < Math.min(t.length, j + 4); z++) {
          const cc = t[z];
          if ((a.op - b.op >= 0.35 && cc.op - b.op >= 0.35) || (b.op - a.op >= 0.35 && b.op - cc.op >= 0.35)) {
            hallazgos.push({ tipo: "parpadeo", desde: a.i, hasta: cc.i, y: `${miles(a.y)}–${miles(cc.y)}`, seccion: c.seccion, detalle: `${c.etiqueta}: op ${a.op}→${b.op}→${cc.op}` });
            break;
          }
        }
      }
    }
  }
  datos.hallazgos = hallazgos;
  datos.resumen = hallazgos.reduce((acc, h) => ((acc[h.tipo] = (acc[h.tipo] ?? 0) + 1), acc), {});
}

// ── Hojas de contacto ─────────────────────────────────────────────────────
const MARCAS = { encimado: "#ff3b30", "cortado-borde": "#ff3b30", "cortado-muesca": "#ff3b30", "cortado-abajo": "#ff3b30", desborde: "#ff3b30", "cuadro-vacio": "#ff9500", "cruce-largo": "#ff9500", "texto-a-medias": "#ffcc00", brinco: "#af52de", parpadeo: "#af52de", "corte-brusco": "#5ac8fa", "tramo-muerto": "#8e8e93" };

async function hoja(datos, carpeta, nombreHoja, registros, titulo) {
  if (!registros.length) return;
  const { mapa } = datos;
  const escritorio = mapa.vw >= 900;
  const cols = escritorio ? 4 : 4;
  const tw = escritorio ? 360 : 240;
  const th = Math.round((tw * mapa.vh) / mapa.vw);
  const etiquetaAlto = 34;
  const hueco = 8;
  const filas = Math.ceil(registros.length / cols);
  const ancho = cols * tw + (cols + 1) * hueco;
  const alto = 44 + filas * (th + etiquetaAlto + hueco) + hueco;
  const capas = [
    {
      input: Buffer.from(`<svg width="${ancho}" height="40"><text x="${hueco}" y="27" font-family="Segoe UI, Arial" font-size="19" font-weight="600" fill="#f2f5f3">${escapar(titulo)}</text></svg>`),
      top: 0,
      left: 0,
    },
  ];
  const marcasPor = {};
  for (const h of datos.hallazgos) for (let i = h.desde; i <= h.hasta; i++) (marcasPor[i] ??= new Set()).add(h.tipo);
  for (const [n, r] of registros.entries()) {
    const x = hueco + (n % cols) * (tw + hueco);
    const y = 44 + Math.floor(n / cols) * (th + etiquetaAlto + hueco);
    // contain: en la hoja de Safari hay fotogramas de dos altos; nada se recorta ni se estira.
    const img = await sharp(join(carpeta, "cuadros", r.archivo)).resize(tw, th, { fit: "contain", background: "#16201b" }).toBuffer();
    capas.push({ input: img, top: y, left: x });
    const tipos = [...(marcasPor[r.i] ?? [])];
    if (tipos.length) {
      const color = MARCAS[tipos[0]] ?? "#ff3b30";
      capas.push({ input: Buffer.from(`<svg width="${tw}" height="${th}"><rect x="2" y="2" width="${tw - 4}" height="${th - 4}" fill="none" stroke="${color}" stroke-width="4"/></svg>`), top: y, left: x });
    }
    const linea1 = `#${r.i} · y ${miles(r.y)} · ${r.seccion} ${Math.round(r.avance * 100)}%`;
    const linea2 = `${r.momento || ""}${tipos.length ? " · " + tipos.join(", ") : ""}`;
    capas.push({
      input: Buffer.from(
        `<svg width="${tw}" height="${etiquetaAlto}"><text x="2" y="14" font-family="Segoe UI, Arial" font-size="12.5" fill="#f2f5f3">${escapar(linea1)}</text><text x="2" y="29" font-family="Segoe UI, Arial" font-size="11.5" fill="${tipos.length ? "#ffb4ab" : "#9fb3a8"}">${escapar(linea2.slice(0, 48))}</text></svg>`,
      ),
      top: y + th + 2,
      left: x,
    });
  }
  await mkdir(join(carpeta, "hojas"), { recursive: true });
  await sharp({ create: { width: ancho, height: alto, channels: 3, background: "#16201b" } })
    .composite(capas)
    .png({ compressionLevel: 8 })
    .toFile(join(carpeta, "hojas", `${nombreHoja}.png`));
}

const muestrear = (lista, n) => (lista.length <= n ? lista : Array.from({ length: n }, (_, i) => lista[Math.round((i * (lista.length - 1)) / (n - 1))]));

async function hojas(datos, carpeta) {
  const { registros, mapa, perfil } = datos;
  await rm(join(carpeta, "hojas"), { recursive: true, force: true });
  const vh = mapa.vh;
  await hoja(datos, carpeta, "00-pagina", muestrear(registros, 24), `${perfil} · la página entera (24 de ${registros.length} fotogramas)`);
  for (const [n, s] of mapa.secciones.entries()) {
    const dentro = registros.filter((r) => r.seccion === s.id);
    await hoja(datos, carpeta, `${String(n + 1).padStart(2, "0")}-${s.id}`, muestrear(dentro, 16), `${perfil} · ${s.id} (${Math.min(16, dentro.length)} de ${dentro.length})`);
    if (n === 0) continue;
    // La costura: todos los fotogramas alrededor del cambio de sección, en orden.
    const anterior = mapa.secciones[n - 1].id;
    const cerca = registros.filter((r) => r.y >= s.top - vh * 0.35 && r.y <= s.top + vh * 0.35);
    for (let k = 0; k * 16 < cerca.length; k++) {
      await hoja(datos, carpeta, `costura-${String(n).padStart(2, "0")}-${anterior}-${s.id}${k ? `-${k + 1}` : ""}`, cerca.slice(k * 16, k * 16 + 16), `${perfil} · de ${anterior} a ${s.id}${k ? ` (${k + 1})` : ""}`);
    }
  }
}

// ── Tiempo real (Chromium, screencast por CDP) ─────────────────────────────
async function tiempoReal(nombre, perfil) {
  const carpeta = join(raizSalida, corrida, nombre, "tiempo");
  await rm(carpeta, { recursive: true, force: true });
  await mkdir(join(carpeta, "cuadros"), { recursive: true });
  const { navegador, contexto, pagina, errores } = await abrir(perfil, { forzarChromium: true });
  const mapa = await pagina.evaluate(leerMapa);
  const cdp = await contexto.newCDPSession(pagina);
  const cuadros = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    cuadros.push({ t: metadata.timestamp, y: Math.round(metadata.scrollOffsetY ?? 0), data });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  // La portada: 5 s quietos arriba (el titular cambia y el cilindro gira solo).
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 60, maxWidth: perfil.w, maxHeight: perfil.h, everyNthFrame: 1 });
  await esperar(5000);
  const escritorio = perfil.w >= 900 && !perfil.tactil;
  if (escritorio) {
    // Rueda del mouse (Lenis suaviza como en una PC de verdad): ~560 px/s.
    await pagina.mouse.move(perfil.w / 2, perfil.h / 2);
    const fondo = mapa.total - mapa.vh;
    for (let n = 0; n < 5000; n++) {
      await pagina.mouse.wheel(0, 50);
      await esperar(90);
      if ((await pagina.evaluate(() => scrollY)) >= fondo - 2) break;
    }
  } else {
    // El dedo: velocidad de lectura, dentro de la página (requestAnimationFrame), ~520 px/s.
    await pagina.evaluate(
      () =>
        new Promise((listo) => {
          const fondo = document.documentElement.scrollHeight - innerHeight;
          let previo = performance.now();
          let y = scrollY;
          const paso = (ahora) => {
            y = Math.min(fondo, y + ((ahora - previo) / 1000) * 520);
            previo = ahora;
            window.scrollTo(0, y);
            if (y >= fondo) listo();
            else requestAnimationFrame(paso);
          };
          requestAnimationFrame(paso);
        }),
    );
  }
  await esperar(1500);
  await cdp.send("Page.stopScreencast");
  await navegador.close();

  const t0 = cuadros[0]?.t ?? 0;
  const registros = [];
  for (const [i, c] of cuadros.entries()) {
    const archivo = `${String(i).padStart(5, "0")}.jpg`;
    await writeFile(join(carpeta, "cuadros", archivo), Buffer.from(c.data, "base64"));
    registros.push({ i, t: Math.round((c.t - t0) * 1000), y: c.y, archivo, ...ubicar(mapa, c.y) });
  }
  // Cuadros largos: más de 50 ms entre dos cuadros mientras el scroll avanza.
  const largos = [];
  for (let i = 1; i < registros.length; i++) {
    const a = registros[i - 1];
    const b = registros[i];
    // Solo en movimiento continuo: la pausa antes de empezar a bajar no es un cuadro perdido.
    const previo = registros[i - 2];
    if (previo && previo.y !== a.y && b.y !== a.y && b.t - a.t > 50) largos.push({ desde: a.i, hasta: b.i, ms: b.t - a.t, y: b.y, seccion: b.seccion, momento: b.momento });
  }
  const datos = { perfil: nombre, corrida, modo: "tiempo", mapa, errores, cuadros: registros.length, duracion: registros.at(-1)?.t ?? 0, largos, registros, hallazgos: [] };
  await writeFile(join(carpeta, "datos.json"), JSON.stringify(datos));
  // Hojas: la portada (primeros 5 s, uno de cada 6) y cada cambio de sección (cuadros seguidos).
  const arriba = registros.filter((r) => r.t <= 5000);
  const hojaT = (nombreHoja, lista, titulo) =>
    hoja({ ...datos, mapa, hallazgos: [] }, carpeta, nombreHoja, lista.map((r) => ({ ...r, avance: r.avance })), titulo);
  await hojaT("00-portada-5s", muestrear(arriba, 16), `${nombre} · tiempo real · la portada, primeros 5 s`);
  for (const [n, s] of mapa.secciones.entries()) {
    if (n === 0) continue;
    const cerca = registros.filter((r) => r.y >= s.top - mapa.vh * 0.25 && r.y <= s.top + mapa.vh * 0.25);
    await hojaT(`costura-${String(n).padStart(2, "0")}-${mapa.secciones[n - 1].id}-${s.id}`, muestrear(cerca, 16), `${nombre} · tiempo real · de ${mapa.secciones[n - 1].id} a ${s.id} (${Math.min(16, cerca.length)} de ${cerca.length} cuadros)`);
  }
  return datos;
}

// ── Las barras de Safari: ¿algo brinca cuando cambia el alto? ──────────────
async function safari(nombre, perfil, altoSinBarras = 750) {
  const carpeta = join(raizSalida, corrida, nombre, "safari");
  await rm(carpeta, { recursive: true, force: true });
  await mkdir(join(carpeta, "cuadros"), { recursive: true });
  const { navegador, pagina, errores } = await abrir(perfil);
  const mapa = await pagina.evaluate(leerMapa);
  const claves = await pagina.evaluate(marcar);
  const puntos = [];
  for (const s of mapa.secciones) {
    const recorrido = Math.max(0, s.alto - mapa.vh);
    for (const f of recorrido > mapa.vh ? [0.3, 0.7] : [0.5]) puntos.push({ seccion: s.id, y: Math.round(s.top + recorrido * f) });
  }
  const registros = [];
  let n = 0;
  for (const p of puntos) {
    await pagina.setViewportSize({ width: perfil.w, height: perfil.h });
    await pagina.evaluate((v) => window.scrollTo(0, v), p.y);
    await pagina.evaluate(asentar, { minimo: 150, maximo: 1600 });
    const antes = await pagina.evaluate(medir);
    await pagina.screenshot({ path: join(carpeta, "cuadros", `${String(n).padStart(4, "0")}.jpg`), type: "jpeg", quality: 80 });
    registros.push({ i: n++, y: p.y, archivo: `${String(n - 1).padStart(4, "0")}.jpg`, seccion: p.seccion, avance: 0, momento: "con barras" });
    await pagina.setViewportSize({ width: perfil.w, height: altoSinBarras });
    await pagina.evaluate(asentar, { minimo: 150, maximo: 1600 });
    const despues = await pagina.evaluate(medir);
    await pagina.screenshot({ path: join(carpeta, "cuadros", `${String(n).padStart(4, "0")}.jpg`), type: "jpeg", quality: 80 });
    const posAntes = Object.fromEntries([...antes.textos, ...antes.ilus].map((x) => [x.k, x.r[1]]));
    let peor = { k: "", d: 0 };
    for (const x of [...despues.textos, ...despues.ilus]) {
      if (posAntes[x.k] === undefined || posAntes[x.k] > perfil.h) continue;
      const d = Math.abs(x.r[1] - posAntes[x.k]);
      if (d > peor.d) peor = { k: x.k, d };
    }
    registros.push({ i: n++, y: p.y, archivo: `${String(n - 1).padStart(4, "0")}.jpg`, seccion: p.seccion, avance: 0, momento: `sin barras · movió ${peor.d}px` });
    if (peor.d > 4) registros.at(-1).brinco = `${claves[peor.k]?.etiqueta}: ${peor.d}px`;
  }
  await navegador.close();
  const hallazgos = registros.filter((r) => r.brinco).map((r) => ({ tipo: "brinco", desde: r.i, hasta: r.i, y: miles(r.y), seccion: r.seccion, detalle: `al esconder las barras: ${r.brinco}` }));
  const datos = { perfil: nombre, corrida, modo: "safari", mapa: { ...mapa, vh: altoSinBarras }, errores, registros, hallazgos };
  await writeFile(join(carpeta, "datos.json"), JSON.stringify(datos));
  for (let k = 0; k * 16 < registros.length; k++) {
    await hoja(datos, carpeta, `safari-${k + 1}`, registros.slice(k * 16, k * 16 + 16), `${nombre} · con barras (${perfil.h}) y sin barras (${altoSinBarras}), por pares`);
  }
  return datos;
}

// ── Antes y después ───────────────────────────────────────────────────────
async function comparar(nombre, corridas, seccion) {
  const [a, b] = corridas.split(",");
  const leer = async (c) => JSON.parse(await readFile(join(raizSalida, c, nombre, "datos.json"), "utf8"));
  const da = await leer(a);
  const db = await leer(b);
  const elegir = (d) => {
    const s = d.mapa.secciones.findIndex((x) => x.id === seccion);
    if (s < 0) throw new Error(`No existe «${seccion}»`);
    const top = d.mapa.secciones[s].top;
    const vh = d.mapa.vh;
    // La sección entera, más la costura con la anterior.
    const lista = d.registros.filter((r) => r.y >= top - vh * 0.35 && r.y <= top + d.mapa.secciones[s].alto - vh * 0.65);
    return muestrear(lista, 8);
  };
  const ra = elegir(da);
  const rb = elegir(db);
  const salida = join(raizSalida, "comparaciones");
  await mkdir(salida, { recursive: true });
  const vw = da.mapa.vw;
  const vh = da.mapa.vh;
  const tw = vw >= 900 ? 300 : 180;
  const th = Math.round((tw * vh) / vw);
  const hueco = 6;
  const ancho = 8 * tw + 9 * hueco + 80;
  const alto = 40 + 2 * (th + 30) + 3 * hueco;
  const capas = [{ input: Buffer.from(`<svg width="${ancho}" height="36"><text x="8" y="25" font-family="Segoe UI, Arial" font-size="18" font-weight="600" fill="#f2f5f3">${escapar(`${nombre} · ${seccion} · ${a} (arriba) y ${b} (abajo)`)}</text></svg>`), top: 0, left: 0 }];
  for (const [fila, lista, carpetaC] of [[0, ra, join(raizSalida, a, nombre, "cuadros")], [1, rb, join(raizSalida, b, nombre, "cuadros")]]) {
    const y = 40 + fila * (th + 30 + hueco);
    capas.push({ input: Buffer.from(`<svg width="76" height="${th}"><text x="4" y="${th / 2}" font-family="Segoe UI, Arial" font-size="15" fill="#9fb3a8">${fila ? escapar(b) : escapar(a)}</text></svg>`), top: y, left: 0 });
    for (const [n, r] of lista.entries()) {
      const x = 80 + hueco + n * (tw + hueco);
      capas.push({ input: await sharp(join(carpetaC, r.archivo)).resize(tw, th).toBuffer(), top: y, left: x });
      capas.push({ input: Buffer.from(`<svg width="${tw}" height="26"><text x="2" y="16" font-family="Segoe UI, Arial" font-size="12" fill="#f2f5f3">${escapar(`${r.seccion} ${Math.round(r.avance * 100)}% · ${r.momento || ""}`.slice(0, 40))}</text></svg>`), top: y + th + 2, left: x });
    }
  }
  const archivo = join(salida, `${nombre}-${seccion}-${a}-vs-${b}.png`);
  await sharp({ create: { width: ancho, height: alto, channels: 3, background: "#16201b" } }).composite(capas).png().toFile(archivo);
  console.log(`Comparación: ${archivo}`);
}

// ── Orquestación ──────────────────────────────────────────────────────────
// --reanalizar: vuelve a calcular las medidas de imagen, los hallazgos y las hojas de una corrida
// ya capturada, sin abrir el navegador (las del DOM se quedan como se midieron).
if ("reanalizar" in args) {
  for (const n of nombres) {
    const carpeta = join(raizSalida, corrida, n);
    const archivo = join(carpeta, "datos.json");
    if (!existsSync(archivo)) {
      console.log(`${n}: no hay datos en «${corrida}»`);
      continue;
    }
    const datos = JSON.parse(await readFile(archivo, "utf8"));
    await analizar(datos, carpeta);
    await writeFile(archivo, JSON.stringify(datos));
    await hojas(datos, carpeta);
    console.log(`${n}: ${Object.entries(datos.resumen).map(([k, v]) => `${k} ${v}`).join(" · ") || "sin hallazgos"}`);
  }
  process.exit(0);
}
if (args.comparar) {
  if (!soloEscena) throw new Error("--comparar necesita --escena <sección>");
  for (const n of nombres) await comparar(n, args.comparar, soloEscena);
  process.exit(0);
}

const resumen = [];
for (const nombre of nombres) {
  const perfil = PERFILES[nombre];
  if (modos.includes("barrido")) {
    const d = await barrido(nombre, perfil);
    const linea = `${nombre}: ${d.registros.length} fotogramas en ${d.segundos} s · ${Object.entries(d.resumen).map(([k, v]) => `${k} ${v}`).join(" · ") || "sin hallazgos"} · errores ${d.errores.length}`;
    console.log(linea);
    resumen.push({ perfil: nombre, modo: "barrido", fotogramas: d.registros.length, resumen: d.resumen, errores: d.errores });
  }
  if (modos.includes("tiempo") && TIEMPO.includes(nombre) && !soloEscena) {
    const d = await tiempoReal(nombre, perfil);
    const peor = d.largos.reduce((m, x) => Math.max(m, x.ms), 0);
    console.log(`${nombre} (tiempo real): ${d.cuadros} cuadros en ${(d.duracion / 1000).toFixed(1)} s · ${d.largos.length} cuadros de más de 50 ms (peor ${peor} ms) · errores ${d.errores.length}`);
    resumen.push({ perfil: nombre, modo: "tiempo", cuadros: d.cuadros, largos: d.largos.length, peor, errores: d.errores });
  }
  if (modos.includes("safari") && nombre === "iphone13" && !soloEscena) {
    const d = await safari(nombre, perfil);
    console.log(`${nombre} (barras de Safari): ${d.registros.length / 2} puntos · ${d.hallazgos.length} brincos · errores ${d.errores.length}`);
    resumen.push({ perfil: nombre, modo: "safari", puntos: d.registros.length / 2, brincos: d.hallazgos.length, errores: d.errores });
  }
}
await mkdir(join(raizSalida, corrida), { recursive: true });
const archivoResumen = join(raizSalida, corrida, "resumen.json");
const previo = existsSync(archivoResumen) ? JSON.parse(await readFile(archivoResumen, "utf8")) : [];
const clave = (x) => `${x.perfil}|${x.modo}`;
const juntos = [...previo.filter((x) => !resumen.some((y) => clave(y) === clave(x))), ...resumen];
await writeFile(archivoResumen, JSON.stringify(juntos, null, 2));
servidor?.close();
process.exit(0);
