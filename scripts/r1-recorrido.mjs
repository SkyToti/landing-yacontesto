// El recorrido «como lo ve una persona» (R-1, revisión del 7-oct-2026): scroll de pausa en pausa a
// velocidad de pulgar (un deslizón suave y luego quieto mientras pasa la actuación), grabado con el
// screencast de Chromium: lo que de verdad se pinta, sin frenar la CPU. Guarda un cuadro cada ~100 ms con
// su posición de scroll y arma hojas de contacto por tramo (de la pausa anterior a la siguiente) y para
// el resto de la página, con la diferencia entre cuadros (Δ) para encontrar brincos. Así se vieron las
// dos escenas encimadas en los cambios de cámara y lo vacío de las escenas de cerca a 1920 px.
// Uso (con el servidor de out/ en marcha): node scripts/r1-recorrido.mjs [URL] [carpeta] [--perfiles iphone,pc,ipad,laptop]
// Por omisión: http://localhost:3200/ e investigacion/r1-capturas/recorrido (fuera de git).
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
// sharp llega con Next (no es dependencia directa): solo arma las hojas de contacto.
import sharp from "sharp";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const [URL = "http://localhost:3200/", SALIDA = "investigacion/r1-capturas/recorrido"] = args.filter((a, i) => !a.startsWith("--") && !String(args[i - 1]).startsWith("--"));
const nombres = opt("--perfiles", "iphone,pc").split(",");

// Las mismas pausas que components/consultorio/pausas.ts (en pantallas de scroll).
const PANTALLAS = 14.75;
const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5, 5.3, 6.0, 6.65, 7.45, 8.1, 8.75, 9.65, 10.3, 11.0, 11.75, 12.7, 13.3, 13.9, 14.5];
// Lo que tarda cada actuación (de scripts/r1-escena.mjs), con medio segundo de holgura.
const ESPERA = { 0: 900, 2: 4300, 4: 3700, 7: 4000, 8: 3000, 9: 2800, 10: 3300, 11: 4200, 12: 3000, 13: 5200, 14: 4000, 15: 2600, 16: 4600, 17: 4000, 18: 1500, 19: 1500, 20: 1500 };
const PERFILES = {
  iphone: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, miniatura: 200, columnas: 6 },
  ipad: { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, miniatura: 280, columnas: 5 },
  pc: { viewport: { width: 1920, height: 950 }, deviceScaleFactor: 1, miniatura: 470, columnas: 3 },
  laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, miniatura: 400, columnas: 3 },
};

const navegador = await chromium.launch();
for (const nombre of nombres) {
  const { miniatura, columnas, ...opciones } = PERFILES[nombre];
  const dir = join(SALIDA, nombre);
  await mkdir(join(dir, "cuadros"), { recursive: true });
  const contexto = await navegador.newContext(opciones);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(String(e)));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  const cdp = await contexto.newCDPSession(pagina);

  // Los tramos: [inicio en s de época, etiqueta, fase].
  const tramos = [];
  const marca = (etiqueta, fase) => tramos.push([Date.now() / 1000, etiqueta, fase]);
  const cuadros = [];
  let ultimo = 0;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    if (metadata.timestamp - ultimo < 0.1) return;
    ultimo = metadata.timestamp;
    cuadros.push({ t: metadata.timestamp, data, y: metadata.scrollOffsetY });
  });

  await pagina.goto(URL, { waitUntil: "networkidle" });
  await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 72, everyNthFrame: 1 });
  const alto = await pagina.evaluate(() => innerHeight);

  // Un deslizón suave (ease-in-out) hasta y, como el pulgar, en requestAnimationFrame.
  const desliza = (destino, ms) =>
    pagina.evaluate(
      ({ destino, ms }) =>
        new Promise((listo) => {
          const y0 = scrollY;
          const t0 = performance.now();
          const paso = (ahora) => {
            const u = Math.min(1, (ahora - t0) / ms);
            const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
            window.scrollTo(0, y0 + (destino - y0) * e);
            if (u < 1) requestAnimationFrame(paso);
            else listo();
          };
          requestAnimationFrame(paso);
        }),
      { destino, ms },
    );
  const yDePausa = (p) =>
    pagina.evaluate(
      ({ p, total }) => {
        const s = document.getElementById("noche");
        return s.offsetTop + (p / total) * (s.offsetHeight - innerHeight);
      },
      { p, total: PANTALLAS },
    );

  marca("P0", "espera");
  await pagina.waitForTimeout(3500);
  for (let k = 1; k < PAUSAS.length; k++) {
    const destino = await yDePausa(PAUSAS[k]);
    const actual = await pagina.evaluate(() => scrollY);
    const ms = Math.max(500, Math.min(1600, (Math.abs(destino - actual) / alto) * 1100));
    marca(`P${k - 1}→P${k}`, "scroll");
    await desliza(destino, ms);
    marca(`P${k}`, "espera");
    await pagina.waitForTimeout((ESPERA[k] ?? 3400) + 500);
    const pausa = await pagina.evaluate(() => document.getElementById("noche").dataset.pausa);
    if (pausa !== String(k)) errores.push(`en P${k} el director dice P${pausa}`);
  }
  // El resto de la página, leyendo: 0.6 pantallas cada 1.4 s hasta el final.
  let n = 0;
  for (;;) {
    const { y, fin } = await pagina.evaluate(() => ({ y: scrollY, fin: document.documentElement.scrollHeight - innerHeight }));
    if (y >= fin - 2) break;
    marca(`despues-${String(++n).padStart(2, "0")}`, "scroll");
    await desliza(Math.min(fin, y + alto * 0.6), 650);
    marca(`despues-${String(n).padStart(2, "0")}`, "espera");
    await pagina.waitForTimeout(1400);
  }
  await pagina.waitForTimeout(600);
  await cdp.send("Page.stopScreencast");
  await contexto.close();

  // A cada cuadro su tramo y su fase; diferencia con el cuadro anterior (miniatura en gris de 48 px).
  const tramoDe = (t) => {
    let r = tramos[0];
    for (const tr of tramos) if (tr[0] <= t) r = tr;
    return r;
  };
  let previo = null;
  const indice = [];
  for (let i = 0; i < cuadros.length; i++) {
    const c = cuadros[i];
    const [inicio, etiqueta, fase] = tramoDe(c.t);
    const archivo = `${String(i).padStart(4, "0")}-${etiqueta.replace("→", "a")}-${fase}.jpg`;
    const buf = Buffer.from(c.data, "base64");
    await writeFile(join(dir, "cuadros", archivo), buf);
    const gris = await sharp(buf).resize(48).greyscale().raw().toBuffer();
    let dif = 0;
    if (previo && previo.length === gris.length) {
      for (let j = 0; j < gris.length; j++) dif += Math.abs(gris[j] - previo[j]);
      dif /= gris.length;
    }
    previo = gris;
    indice.push({ i, archivo, etiqueta, fase, ms: Math.round((c.t - inicio) * 1000), pantallas: +(c.y / alto).toFixed(2), dif: +dif.toFixed(1) });
  }
  await writeFile(join(dir, "indice.json"), JSON.stringify(indice, null, 1));

  // Hojas de contacto por tramo: todo el deslizón y, de la espera, un cuadro cada ~400 ms.
  const porTramo = new Map();
  for (const c of indice) {
    const clave = c.etiqueta.startsWith("despues") ? "despues" : c.etiqueta.includes("→") ? c.etiqueta : `${c.etiqueta}`;
    if (!porTramo.has(clave)) porTramo.set(clave, []);
    porTramo.get(clave).push(c);
  }
  // Une cada deslizón con la espera que le sigue: «P8→P9» + «P9».
  const hojas = [];
  for (let k = 0; k < PAUSAS.length; k++) {
    const lista = [...(k ? porTramo.get(`P${k - 1}→P${k}`) ?? [] : []), ...(porTramo.get(`P${k}`) ?? [])];
    hojas.push([k ? `P${k - 1}aP${k}` : "P0", lista]);
  }
  const despues = porTramo.get("despues") ?? [];
  for (let i = 0; i < despues.length; i += columnas * 4) hojas.push([`despues-${i / (columnas * 4) + 1}`, despues.slice(i, i + columnas * 4)]);

  const primero = await sharp(join(dir, "cuadros", indice[0].archivo)).metadata();
  const ancho = miniatura;
  const altoMini = Math.round((primero.height / primero.width) * ancho);
  for (const [nombreHoja, lista] of hojas) {
    let elegidos = [];
    let ultimoEspera = -1e9;
    for (const c of lista) {
      if (c.fase === "scroll" || nombreHoja.startsWith("despues")) elegidos.push(c);
      else if (c.ms - ultimoEspera >= 400) {
        elegidos.push(c);
        ultimoEspera = c.ms;
      }
    }
    if (!elegidos.length) continue;
    const filas = Math.ceil(elegidos.length / columnas);
    const etiqueta = 18;
    const lienzo = sharp({ create: { width: columnas * (ancho + 6), height: filas * (altoMini + etiqueta + 6), channels: 3, background: "#777" } });
    const capas = [];
    for (let i = 0; i < elegidos.length; i++) {
      const c = elegidos[i];
      const x = (i % columnas) * (ancho + 6);
      const y = Math.floor(i / columnas) * (altoMini + etiqueta + 6);
      capas.push({ input: await sharp(join(dir, "cuadros", c.archivo)).resize(ancho, altoMini).toBuffer(), left: x, top: y + etiqueta });
      const texto = `${c.i} ${c.fase === "scroll" ? "▶" : "■"} ${c.pantallas} pant · +${c.ms} ms · Δ${c.dif}`;
      capas.push({
        input: Buffer.from(`<svg width="${ancho}" height="${etiqueta}"><rect width="100%" height="100%" fill="${c.fase === "scroll" ? "#ffe082" : "#fff"}"/><text x="3" y="13" font-family="Arial" font-size="12">${texto}</text></svg>`),
        left: x,
        top: y,
      });
    }
    await lienzo.composite(capas).jpeg({ quality: 80 }).toFile(join(dir, `hoja-${nombreHoja}.jpg`));
  }
  const saltos = [...indice].sort((a, b) => b.dif - a.dif).slice(0, 15).map((c) => `${c.i} ${c.etiqueta} ${c.fase} +${c.ms}ms Δ${c.dif}`);
  console.log(`${nombre}: ${cuadros.length} cuadros, ${hojas.length} hojas. Errores: ${errores.length ? errores.join(" | ") : "ninguno"}`);
  console.log("  mayores cambios entre cuadros:", saltos.join(" · "));
}
await navegador.close();
