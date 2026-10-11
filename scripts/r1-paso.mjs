// El paso a paso en pantallas táctiles (9-oct-2026): dentro de la historia, cada deslizón avanza o regresa UNA
// pausa, sin importar la fuerza; después de la última, el scroll vuelve a ser normal.
// Chromium sin ventana no genera inercia con toques simulados (medido el 9-oct: un deslizón de 600 px en 4 ms
// avanza solo lo que movió el dedo), así que aquí se simula como en iOS: si la página siguió al dedo (scroll
// nativo), al soltar sigue a la velocidad del dedo y frena 0.998 por ms (la constante de iOS que se atribuye a
// la charla de Apple de 2018). Sin el paso a paso, un deslizón rápido se brinca varias pausas.
// También el ritmo (Diego, 9-oct: «los movimientos de cámara pasan muy rápido»): un paso con cámara (la T3)
// tarda de 2 a 3.6 s y uno común menos de 1.3; y en escritorio, la rueda a media T3 termina la transición
// hacia adelante, sin regresar la cámara.
// Desde el 10-oct: el iPhone, con el scroll que se aplica unos cuadros tarde (como lo midió Diego), y si un
// paso no mueve la página el paso a paso se apaga solo (la red de seguridad). ?paso=0 lo apaga.
// Perfil: iPhone 13 con las barras de Safari (390 × 664); escritorio y movimiento reducido no deben cambiar.
// Uso (con el servidor de out/ en marcha): node scripts/r1-paso.mjs [URL]
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
// Las mismas pausas que components/consultorio/pausas.ts (en pantallas de scroll).
const PANTALLAS = 14.75;
const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5, 5.3, 6.0, 6.65, 7.45, 8.1, 8.75, 9.65, 10.3, 11.0, 11.75, 12.7, 13.3, 13.9, 14.5];
const IPHONE = { viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const fallas = [];
const revisa = (cond, texto) => {
  if (!cond) fallas.push(texto);
  console.log(`${cond ? "✓" : "✗"} ${texto}`);
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const navegador = await chromium.launch();

async function abrir(opciones, { escena = true } = {}) {
  return abrirEn(URL, opciones, { escena });
}
async function abrirEn(direccion, opciones, { escena = true } = {}) {
  const contexto = await navegador.newContext(opciones);
  const p = await contexto.newPage();
  const errores = [];
  p.on("pageerror", (e) => errores.push(e.message));
  p.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await p.goto(direccion, { waitUntil: "networkidle" });
  if (escena) await p.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  const geo = await p.evaluate(() => {
    const s = document.getElementById("noche");
    return { top: s.offsetTop, alto: s.offsetHeight, h: innerHeight };
  });
  return { contexto, p, errores, geo, cdp: await contexto.newCDPSession(p) };
}

const yPausa = (geo, k) => geo.top + (PAUSAS[k] / PANTALLAS) * (geo.alto - geo.h);
const finHistoria = (geo) => geo.top + geo.alto - geo.h;

/** Dónde quedó: la pausa más cercana (o «después», pasada la historia) y si el paso a paso está prendido. */
async function estado({ p, geo }) {
  const { y, paso } = await p.evaluate(() => ({ y: scrollY, paso: document.documentElement.classList.contains("paso") }));
  if (y > finHistoria(geo) + 8) return { y, k: "después", paso };
  let k = 0;
  PAUSAS.forEach((_, i) => {
    if (Math.abs(yPausa(geo, i) - y) < Math.abs(yPausa(geo, k) - y)) k = i;
  });
  return { y, k, paso, fuera: Math.round(Math.abs(yPausa(geo, k) - y)) };
}

/** Espera a que el scroll se quede quieto (sin cambios durante `quieto` ms). */
async function asentado({ p }, quieto = 400, tope = 6000) {
  const t0 = Date.now();
  let antes = await p.evaluate(() => scrollY);
  let desde = Date.now();
  while (Date.now() - t0 < tope) {
    await espera(80);
    const y = await p.evaluate(() => scrollY);
    if (y !== antes) {
      antes = y;
      desde = Date.now();
    } else if (Date.now() - desde >= quieto) return;
  }
}

/**
 * Un deslizón: el dedo va de (x0, y0) a (x1, y1) en `ms`. Si el navegador puede desplazar la página con ese
 * dedo (el `touch-action` de lo que toca y de sus ancestros deja pan-y), al soltar sigue la inercia de iOS,
 * como en un iPhone: la inercia solo existe cuando la página iba siguiendo al dedo. No se deduce de cuánto se
 * movió la página: un paso anterior que aún va en camino también la mueve.
 */
async function desliza(sesion, { x0 = 200, y0 = 540, x1 = 200, y1 = 140, ms = 50 } = {}) {
  const { p, cdp } = sesion;
  const pasos = Math.max(2, Math.round(ms / 8));
  const antes = await p.evaluate(() => scrollY);
  const panea = await p.evaluate(
    ({ x, y }) => {
      for (let el = document.elementFromPoint(x, y); el; el = el.parentElement) {
        const t = getComputedStyle(el).touchAction;
        if (t === "none" || t === "pinch-zoom" || t === "pan-x") return false;
      }
      return true;
    },
    { x: x0, y: y0 },
  );
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= pasos; i++) {
    await espera(ms / pasos);
    const t = i / pasos;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t }] });
  }
  const alSoltar = await p.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const dedo = y0 - y1;
  const nativo = panea && Math.abs(dedo) > 0;
  if (nativo) {
    await p.evaluate(
      (v0) =>
        new Promise((listo) => {
          let v = v0;
          let t0 = performance.now();
          const cuadro = (t) => {
            const dt = t - t0;
            t0 = t;
            window.scrollBy(0, v * dt);
            v *= Math.pow(0.998, dt);
            if (Math.abs(v) > 0.02) requestAnimationFrame(cuadro);
            else listo();
          };
          requestAnimationFrame(cuadro);
        }),
      dedo / ms,
    );
  }
  return { nativo, movioConElDedo: Math.round(alSoltar - antes) };
}

/** Cuánto tarda el scroll en llegar a y (±3 px), contado desde ahora; null si no llega en `tope` ms. */
const llegaEn = ({ p }, y, tope = 6000) =>
  p.evaluate(
    ({ y, tope }) =>
      new Promise((listo) => {
        const t0 = performance.now();
        const mira = () => {
          const t = performance.now() - t0;
          if (Math.abs(scrollY - y) <= 3) listo(Math.round(t));
          else if (t > tope) listo(null);
          else requestAnimationFrame(mira);
        };
        requestAnimationFrame(mira);
      }),
    { y, tope },
  );

async function toca({ cdp }, x, y) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await espera(60);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const fmt = (e) => (e.k === "después" ? "después" : `P${e.k}${e.fuera > 3 ? ` (+${e.fuera}px)` : ""}`);

/* ── Celular (Android; Chromium con la pantalla del iPhone 13): la historia, deslizón por deslizón ── */
{
  const s = await abrir(IPHONE);
  let e = await estado(s);
  revisa(e.k === 0 && e.paso, `celular: abre en P0 con el paso a paso prendido (${fmt(e)}, paso ${e.paso})`);

  // 1. Un deslizón rápido (400 px en 50 ms ≈ 8,000 px/s): una sola pausa, y la página no sigue al dedo.
  let d = await desliza(s, { ms: 50 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 1 && e.fuera <= 3, `deslizón rápido desde P0: llega a P1 (llegó a ${fmt(e)}; la página siguió al dedo ${d.movioConElDedo}px)`);
  // Con el dedo, la página no lo sigue: lo poco que se mueve es el paso, que arranca a media caricia.
  revisa(!d.nativo && d.movioConElDedo < 200, `el scroll nativo está apagado en la historia (con el dedo se movió ${d.movioConElDedo}px de 400)`);

  // 2. Cuatro deslizones rápidos más, uno tras otro: P2 a P5, una por deslizón.
  const llegadas = [];
  for (let i = 0; i < 4; i++) {
    await desliza(s, { ms: 40 });
    await asentado(s);
    llegadas.push(fmt(await estado(s)));
  }
  revisa(llegadas.join(" ") === "P2 P3 P4 P5", `cuatro deslizones rápidos: una pausa cada uno (${llegadas.join(" → ")})`);

  // 3. Dos deslizones seguidos (el segundo mientras el primero aún se mueve): dos pausas, no más.
  await desliza(s, { ms: 40 });
  await espera(150);
  await desliza(s, { ms: 40 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 7 && e.fuera <= 3, `dos deslizones seguidos desde P5: llega a P7 (llegó a ${fmt(e)})`);

  // 4. Un arrastre lento y largo (600 px en 1.2 s): una sola pausa por gesto.
  await desliza(s, { y0: 620, y1: 20, ms: 1200 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 8 && e.fuera <= 3, `arrastre lento de 600 px desde P7: llega a P8 (llegó a ${fmt(e)})`);

  // 5. Hacia abajo: regresa una.
  await desliza(s, { y0: 140, y1: 540, ms: 50 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 7 && e.fuera <= 3, `deslizón hacia abajo desde P8: regresa a P7 (llegó a ${fmt(e)})`);

  // 6. De lado: nada.
  await desliza(s, { x0: 340, y0: 400, x1: 40, y1: 380, ms: 60 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 7 && e.fuera <= 3, `deslizón de lado en P7: se queda (quedó en ${fmt(e)})`);

  // 7. El final: de P19 a P20 y de ahí a «Así lo instalamos», con el scroll normal.
  await s.p.evaluate((y) => window.scrollTo(0, y), yPausa(s.geo, 19));
  await asentado(s);
  await espera(800);
  await desliza(s, { ms: 50 });
  await asentado(s);
  e = await estado(s);
  revisa(e.k === 20 && e.fuera <= 3, `de P19, un deslizón: P20 (llegó a ${fmt(e)})`);
  await desliza(s, { ms: 50 });
  await asentado(s);
  e = await estado(s);
  const instalacion = await s.p.evaluate(() => Math.round(document.getElementById("instalacion").getBoundingClientRect().top));
  revisa(e.k === "después" && !e.paso && instalacion >= 0 && instalacion <= 140,
    `de P20, un deslizón: «Así lo instalamos» arriba y el scroll normal (sección a ${instalacion}px, paso ${e.paso})`);
  const y0 = e.y;
  d = await desliza(s, { ms: 60 });
  await asentado(s);
  e = await estado(s);
  revisa(d.nativo && e.y - y0 > 400, `en lo de después el dedo mueve la página como siempre (avanzó ${Math.round(e.y - y0)}px)`);

  // 8. De regreso a la historia, el paso a paso se vuelve a prender.
  await s.p.evaluate((y) => window.scrollTo(0, y), yPausa(s.geo, 12));
  await asentado(s);
  await espera(400);
  e = await estado(s);
  revisa(e.paso, `al volver a la historia el paso a paso se prende otra vez (${fmt(e)}, paso ${e.paso})`);

  // 9. El ritmo: de P12 a P13 cruza la T3 (cámara) despacio; de P13 a P14, un paso común.
  await espera(600);
  let llegada = llegaEn(s, yPausa(s.geo, 13));
  await desliza(s, { ms: 50 });
  let ms = await llegada;
  revisa(ms !== null && ms >= 2000 && ms <= 3600, `de P12 a P13 (la T3, con cámara) tarda ${ms} ms (de 2,000 a 3,600)`);
  await asentado(s);
  await espera(600);
  llegada = llegaEn(s, yPausa(s.geo, 14));
  await desliza(s, { ms: 50 });
  ms = await llegada;
  revisa(ms !== null && ms <= 1300, `de P13 a P14 (sin cámara) tarda ${ms} ms (hasta 1,300)`);


  revisa(s.errores.length === 0, `celular: ${s.errores.length} errores de consola${s.errores.length ? `: ${s.errores.join(" | ")}` : ""}`);
  await s.contexto.close();
}

/*
 * ── Los toques siguen funcionando: dos deslizones y «Precio» de la pastilla ──
 * En su propia página: en Chromium sin ventana no hay cuadros, y la inercia de un gesto bloqueado (de lado,
 * hacia abajo) o nativo nunca termina; el siguiente toque solo la frena, sin clic (medido el 9-oct). En un
 * celular esa inercia acaba sola en un instante.
 */
{
  const s = await abrir(IPHONE);
  await desliza(s, { ms: 50 });
  await asentado(s);
  await desliza(s, { ms: 50 });
  await asentado(s);
  await espera(600);
  const donde = fmt(await estado(s));
  const caja = await s.p.evaluate(() => {
    const r = document.querySelector(".p-precio").getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    window.__clicPrecio = false;
    document.querySelector(".p-precio").addEventListener("click", () => (window.__clicPrecio = true), { once: true });
    const bajo = document.elementFromPoint(x, y);
    return { x, y, bajo: bajo ? `${bajo.tagName.toLowerCase()}.${String(bajo.className).split(" ")[0]}` : "nada" };
  });
  await toca(s, caja.x, caja.y);
  await asentado(s);
  const { precio, clic } = await s.p.evaluate(() => ({
    precio: Math.round(document.getElementById("precio").getBoundingClientRect().top),
    clic: window.__clicPrecio,
  }));
  const e = await estado(s);
  revisa(precio >= 0 && precio <= 120 && !e.paso,
    `tocar «Precio» en ${donde} lleva al precio (a ${precio}px; bajo el dedo: ${caja.bajo}; click: ${clic}) y suelta el scroll`);

  revisa(s.errores.length === 0, `toques: ${s.errores.length} errores de consola`);
  await s.contexto.close();
}

/*
 * ── iPhone y iPad (10-oct) ──
 * En el iPhone de Diego el scroll que se pide se aplica con unos cuadros de retraso (medido con ?depura=1: a
 * media subida la página iba en 393 con 469 ya pedido), y eso cortaba el viaje («otra cosa movió la
 * página»): la página no se movía. Aquí, Chromium con el agente de un iPhone y un window.scrollTo que aplica
 * cada petición 3 cuadros después, como el iPhone. Con la versión que comparaba contra lo último pedido,
 * este viaje se cortaba.
 */
{
  const UA_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const URL_ORIGINAL = URL;
  const s = await abrirEn(`${URL_ORIGINAL}?depura=1`, { ...IPHONE, userAgent: UA_IPHONE });
  let e = await estado(s);
  revisa(e.paso, `iPhone: con paso a paso (paso ${e.paso})`);
  await s.p.evaluate(() => {
    const aplica = window.scrollTo.bind(window);
    const cola = [];
    let cuadro = 0;
    window.scrollTo = (x, y) => cola.push({ x, y, en: cuadro + 3 });
    const bombea = () => {
      cuadro++;
      while (cola.length && cola[0].en <= cuadro) {
        const { x, y } = cola.shift();
        aplica(x, y);
      }
      requestAnimationFrame(bombea);
    };
    requestAnimationFrame(bombea);
  });
  const caja = () =>
    s.p.evaluate(() => [...document.body.children].find((el) => el.style.position === "fixed" && el.getAttribute("aria-hidden") === "true")?.textContent ?? "");
  await desliza(s, { ms: 50 });
  await asentado(s, 600, 8000);
  e = await estado(s);
  let registro = await caja();
  revisa(e.k === 1 && e.fuera <= 3 && !registro.includes("otra cosa movió"),
    `iPhone con el scroll 3 cuadros tarde: un deslizón llega a P1 sin cortarse (llegó a ${fmt(e)}${registro.includes("otra cosa movió") ? "; se cortó" : ""})`);
  // Un paso con cámara (de P6 a P7, la T1), también con el retraso.
  await s.p.evaluate((y) => window.scrollTo(0, y), yPausa(s.geo, 6));
  await asentado(s, 600, 8000);
  await espera(600);
  await desliza(s, { ms: 50 });
  await asentado(s, 600, 8000);
  e = await estado(s);
  registro = await caja();
  revisa(e.k === 7 && e.fuera <= 3 && !registro.includes("otra cosa movió"),
    `iPhone con el scroll tarde: de P6, un deslizón cruza la T1 hasta P7 sin cortarse (llegó a ${fmt(e)})`);
  revisa(s.errores.length === 0, `iPhone: ${s.errores.length} errores de consola`);
  await s.contexto.close();

  // Con ?paso=0 se apaga: el scroll de siempre.
  const f = await abrirEn(`${URL_ORIGINAL}?paso=0`, { ...IPHONE, userAgent: UA_IPHONE });
  e = await estado(f);
  revisa(!e.paso, `?paso=0: sin paso a paso (paso ${e.paso})`);
  const d = await desliza(f, { ms: 60 });
  revisa(d.nativo && d.movioConElDedo > 200, `?paso=0: el dedo mueve la página como siempre (${d.movioConElDedo}px)`);
  await f.contexto.close();
}

/*
 * ── La red de seguridad: si el navegador no aplica el scroll que se le pide, el paso a paso se apaga ──
 * Se simula con un window.scrollTo que no hace nada (lo que pudo pasar en el iPhone de Diego).
 */
{
  const s = await abrir(IPHONE);
  await s.p.evaluate(() => (window.scrollTo = () => {}));
  await desliza(s, { ms: 50 });
  await espera(1200);
  let e = await estado(s);
  revisa(!e.paso, `red de seguridad: si un paso no mueve la página, el paso a paso se apaga (paso ${e.paso})`);
  const d = await desliza(s, { ms: 60 });
  revisa(d.nativo && d.movioConElDedo > 200, `red de seguridad: luego el dedo mueve la página como siempre (${d.movioConElDedo}px)`);
  await s.contexto.close();
}

/* ── Escritorio: nada cambia (rueda del ratón como siempre) ── */
{
  const s = await abrir({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  let e = await estado(s);
  revisa(!e.paso, `escritorio: sin paso a paso`);
  await s.p.mouse.move(640, 400);
  await s.p.mouse.wheel(0, 2400);
  await asentado(s);
  e = await estado(s);
  revisa(e.y > 1200, `escritorio: la rueda avanza como siempre (scroll en ${Math.round(e.y)}px, ${fmt(e)})`);
  // Tres muescas desde P12 dejan el scroll a media T3, más cerca de P12 (a 1280 × 800: 0.375 pantallas de
  // 0.9): el imán la termina hacia adelante. Con la pausa más cercana regresaba a P12, y la cámara iba al
  // doctor y volvía (grabado el 9-oct).
  await s.p.evaluate((y) => window.scrollTo(0, y), yPausa(s.geo, 12));
  await asentado(s);
  await espera(800);
  for (let i = 0; i < 3; i++) {
    await s.p.mouse.wheel(0, 100);
    await espera(90);
  }
  await asentado(s, 600, 8000);
  e = await estado(s);
  revisa(e.k === 13 && e.fuera <= 3, `escritorio: tres muescas a media T3 terminan en P13, sin regresar (quedó en ${fmt(e)})`);
  revisa(s.errores.length === 0, `escritorio: ${s.errores.length} errores de consola`);
  await s.contexto.close();
}

/* ── Movimiento reducido en el celular: la versión quieta, con el scroll de siempre ── */
{
  const s = await abrir({ ...IPHONE, reducedMotion: "reduce" }, { escena: false });
  const { paso, cine } = await s.p.evaluate(() => ({ paso: document.documentElement.classList.contains("paso"), cine: document.documentElement.classList.contains("cine") }));
  revisa(!paso && !cine, `movimiento reducido: sin escena y sin paso a paso`);
  const d = await desliza(s, { ms: 60 });
  revisa(d.nativo, `movimiento reducido: el dedo mueve la página (se movió ${d.movioConElDedo}px con el dedo)`);
  await s.contexto.close();
}

await navegador.close();
console.log(fallas.length ? `\n${fallas.length} falla(s)` : "\nTodo en orden");
process.exit(fallas.length ? 1 : 0);
