// Lo que sigue al día (R-1, paso 6): captura la instalación, el precio, las preguntas, el cierre y el pie,
// con la escena encendida y en la versión quieta, a 390 × 844 y a 1280 × 800. Prueba también lo que se toca:
// la calculadora (300, 310 y 900 pacientes), abrir una pregunta, tocar a Moli (salta y contesta), que la
// pastilla se acople al botón del cierre y que «Precio» de la pastilla salte a su sección.
// Uso (con el servidor de out/ en marcha): node scripts/r1-despues.mjs [URL] [carpeta]
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
const SALIDA = process.argv[3] ?? "investigacion/r1-capturas/paso6";
const PERFILES = [
  { nombre: "movil", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nombre: "escritorio", viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];
const SECCIONES = ["instalacion", "precio", "preguntas", "cierre"];

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const fallas = [];
const revisa = (cond, texto) => {
  if (!cond) fallas.push(texto);
  console.log(`${cond ? "✓" : "✗"} ${texto}`);
};

for (const quieta of [false, true]) {
  for (const perfil of PERFILES) {
    const nombre = `${perfil.nombre}${quieta ? "-quieta" : ""}`;
    const contexto = await navegador.newContext({ ...perfil, reducedMotion: quieta ? "reduce" : "no-preference" });
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on("pageerror", (e) => errores.push(e.message));
    pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    await pagina.goto(URL, { waitUntil: "networkidle" });
    if (!quieta) await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
    revisa((await pagina.evaluate(() => document.documentElement.classList.contains("cine"))) === !quieta, `${nombre}: clase cine ${quieta ? "apagada" : "prendida"}`);

    // La transcripción (paso 7, noche/aplazados.ts) ya se soltó entera, y los lectores de pantalla ya
    // tienen todos los títulos (también los de después, que VidaCierre suelta en ratos libres).
    await pagina
      .waitForFunction(
        () =>
          !document.documentElement.classList.contains("aplaza") &&
          Array.from(document.querySelectorAll(".despues .seccion, .pie")).every((e) => e.style.contentVisibility === "visible"),
        null,
        { timeout: 10000 },
      )
      .catch(() => {});
    const aplazado = await pagina.evaluate(() => {
      const piezas = Array.from(document.querySelectorAll("#noche > .solo-lectores > *"));
      return { clase: document.documentElement.classList.contains("aplaza"), saltadas: piezas.filter((e) => getComputedStyle(e).display === "none").length, piezas: piezas.length, titulos: document.querySelectorAll("h1, h2").length };
    });
    const ax = await (await contexto.newCDPSession(pagina)).send("Accessibility.getFullAXTree");
    const titulosAx = ax.nodes.filter((n) => !n.ignored && n.role?.value === "heading").length;
    revisa(!aplazado.clase && aplazado.saltadas === 0, `${nombre}: lo aplazado ya se soltó (${JSON.stringify(aplazado)})`);
    revisa(titulosAx >= aplazado.titulos, `${nombre}: los ${aplazado.titulos} títulos están en el árbol de accesibilidad (${titulosAx})`);

    // «Precio» de la pastilla salta a su sección.
    await pagina.click(".p-precio");
    await pagina.waitForTimeout(900);
    const topPrecio = await pagina.evaluate(() => Math.round(document.getElementById("precio").getBoundingClientRect().top));
    revisa(topPrecio >= 0 && topPrecio <= 80, `${nombre}: «Precio» deja la sección arriba (top ${topPrecio} px)`);

    for (const id of SECCIONES) {
      await pagina.evaluate((id) => document.getElementById(id).scrollIntoView({ block: "start" }), id);
      await pagina.waitForTimeout(id === "precio" ? 1200 : 500);
      await pagina.screenshot({ path: `${SALIDA}/${nombre}-${id}.png` });
    }
    // La sección del precio completa (la tarjeta es más alta que la pantalla en el celular).
    await pagina.locator("#precio").screenshot({ path: `${SALIDA}/${nombre}-precio-entero.png` });

    // La calculadora, ya hidratada.
    const deslizador = pagina.locator("#pacientes");
    for (const [n, esperado] of [[300, "$990"], [310, "$1,490"], [900, "$1,790"]]) {
      await deslizador.evaluate((el, n) => {
        const fijar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        fijar.call(el, String(n));
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, n);
      await pagina.waitForTimeout(150);
      const mes = await pagina.locator(".calc-mes b").textContent();
      revisa(mes === esperado, `${nombre}: ${n} pacientes → ${mes} (se espera ${esperado})`);
    }

    // Una pregunta se abre.
    await pagina.locator(".pregunta summary").nth(2).click();
    revisa(await pagina.locator(".pregunta").nth(2).evaluate((d) => d.open), `${nombre}: la pregunta 3 se abre`);
    await pagina.locator("#preguntas").screenshot({ path: `${SALIDA}/${nombre}-preguntas-abierta.png` });

    // El cierre: la pastilla se acopla y Moli contesta.
    await pagina.evaluate(() => document.querySelector(".cierre-boton").scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(800);
    const acople = await pagina.evaluate(() => ({
      clase: document.documentElement.classList.contains("acoplada"),
      opacidad: getComputedStyle(document.querySelector(".pastilla")).opacity,
      inerte: document.querySelector(".pastilla").inert,
    }));
    revisa(acople.clase && acople.opacidad === "0" && acople.inerte, `${nombre}: la pastilla se acopla al botón (${JSON.stringify(acople)})`);
    await pagina.locator(".cierre-toque").click();
    await pagina.waitForTimeout(quieta ? 200 : 300);
    await pagina.screenshot({ path: `${SALIDA}/${nombre}-cierre-toque.png` });
    const nota = await pagina.locator(".nota-cierre").textContent();
    revisa(nota === "¡ya contesto!", `${nombre}: Moli contesta «${nota}»`);
    const salta = await pagina.evaluate(() => document.querySelector(".moli-cierre").classList.contains("salta"));
    revisa(salta === !quieta, `${nombre}: ${quieta ? "no salta (movimiento reducido)" : "salta"}`);

    // De regreso arriba, la pastilla vuelve.
    await pagina.evaluate(() => document.getElementById("preguntas").scrollIntoView({ block: "start" }));
    await pagina.waitForTimeout(700);
    revisa(!(await pagina.evaluate(() => document.documentElement.classList.contains("acoplada"))), `${nombre}: la pastilla regresa al salir del cierre`);

    await pagina.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await pagina.waitForTimeout(600);
    await pagina.screenshot({ path: `${SALIDA}/${nombre}-pie.png` });

    // Si algo pasa del ancho, el celular hace zoom hacia afuera y innerWidth crece con él: se revisan los dos.
    const vista = await pagina.evaluate(() => innerWidth);
    revisa(vista === perfil.viewport.width, `${nombre}: sin zoom hacia afuera (innerWidth ${vista})`);
    const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisa(ancho <= 0, `${nombre}: sin scroll horizontal (${ancho})`);
    revisa(errores.length === 0, `${nombre}: 0 errores de consola${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await contexto.close();
  }
}

// La pastilla mide lo mismo con la fuente de respaldo que con Instrument Sans: no brinca cuando llega
// (PageSpeed marcaba CLS 0.001 por eso, 7-oct). Sin fuentes de la página = lo que se ve mientras cargan.
const medidas = [];
for (const sinFuentes of [true, false]) {
  const c = await navegador.newContext(PERFILES[0]);
  const pg = await c.newPage();
  if (sinFuentes) await pg.route(/\.woff2$/, (r) => r.abort());
  await pg.goto(URL, { waitUntil: "load" });
  await pg.waitForTimeout(600);
  medidas.push(
    await pg.evaluate(() => {
      const n = document.querySelector(".pastilla").getBoundingClientRect();
      const w = document.querySelector(".p-whatsapp").getBoundingClientRect();
      return [n.left, n.width, w.left, w.width].map((v) => Math.round(v * 100) / 100);
    }),
  );
  await c.close();
}
revisa(medidas[0].every((v, i) => Math.abs(v - medidas[1][i]) < 0.1), `la pastilla no brinca al llegar la fuente (respaldo ${medidas[0]} · final ${medidas[1]})`);

// Sin JavaScript: todo está y el botón para tocar a Moli no aparece.
const sinJs = await navegador.newContext({ ...PERFILES[0], javaScriptEnabled: false });
const p = await sinJs.newPage();
await p.goto(URL, { waitUntil: "networkidle" });
const estado = await p.evaluate(() => ({
  pasos: document.querySelectorAll(".taco-paso").length,
  preguntas: document.querySelectorAll(".pregunta").length,
  calculadora: document.querySelector(".calc-mes b")?.textContent,
  toque: getComputedStyle(document.querySelector(".cierre-toque")).display,
  pie: !!document.querySelector('.pie a[href="/privacidad/"]'),
}));
revisa(estado.pasos === 3 && estado.preguntas === 7 && estado.calculadora === "$990" && estado.toque === "none" && estado.pie, `sin JavaScript: ${JSON.stringify(estado)}`);
await p.evaluate(() => document.getElementById("precio").scrollIntoView());
await p.screenshot({ path: `${SALIDA}/sinjs-precio.png` });
await sinJs.close();

await navegador.close();
console.log(fallas.length ? `\n${fallas.length} falla(s)` : "\nTodo en orden");
process.exit(fallas.length ? 1 : 0);
