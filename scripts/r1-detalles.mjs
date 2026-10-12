// Los 5 detalles del 11-oct-2026 (aprobados por Diego; prototipo en investigacion/detalles-2026-10-11/):
// 1 la palomita del logo se dibuja (al abrir y con el cursor), 2 la flecha de WhatsApp se manda al tocar,
// 3 las hojas del taco caen y el día 7 lleva su sello, 4 el precio cuenta en vez de brincar, 5 Moli voltea
// a ver «¡Escríbenos!». Cada uno con movimiento y con «menos movimiento», en compu y en celular; el logo,
// también en WebKit (el hueco es una máscara: hay que ver que se dibuje de verdad, no solo el número).
// Uso (con el servidor de out/ en marcha): node scripts/r1-detalles.mjs [URL]
import { chromium, webkit } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
const fallas = [];
const revisa = (cond, texto) => {
  if (!cond) fallas.push(texto);
  console.log(`${cond ? "✓" : "✗"} ${texto}`);
};
const PERFILES = {
  escritorio: { viewport: { width: 1280, height: 800 } },
  movil: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// ¿Se ve el fondo por el hueco de la palomita? Toma un punto a la mitad del trazo largo (27.5, 22.5 en el
// viewBox del logo), lo lleva a la pantalla y compara su color con el del globo (crema) y el de la cabecera.
async function huecoAbierto(pagina) {
  const punto = await pagina.evaluate(() => {
    const svg = document.querySelector(".cabecera .marca-logo");
    const pt = svg.createSVGPoint();
    pt.x = 27.5;
    pt.y = 22.5;
    const p = pt.matrixTransform(svg.getScreenCTM());
    return { x: Math.round(p.x), y: Math.round(p.y) };
  });
  const foto = await pagina.screenshot({ clip: { x: punto.x - 1, y: punto.y - 1, width: 3, height: 3 } });
  // PNG de 3×3: basta con decodificarlo con el canvas de la propia página.
  const brillo = await pagina.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const [r, gr, b] = g.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data;
    return (r + gr + b) / 3;
  }, foto.toString("base64"));
  return brillo < 128; // el globo es crema (claro); por el hueco se ve la noche (oscura)
}

async function abrir(motor, perfil, quieto) {
  const navegador = await motor.launch();
  const contexto = await navegador.newContext({ ...PERFILES[perfil], reducedMotion: quieto ? "reduce" : "no-preference" });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  // Los botones de WhatsApp abren otra pestaña: en la prueba solo importa la flecha.
  await pagina.addInitScript(() =>
    document.addEventListener("click", (e) => e.target.closest?.('a[href*="wa.me"]') && e.preventDefault(), true),
  );
  return { navegador, pagina, errores };
}

const valor = (pagina, sel, prop) => pagina.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
const fijarPacientes = (pagina, n) =>
  pagina.locator("#pacientes").evaluate((el, n) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(n));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, n);

for (const quieto of [false, true]) {
  for (const perfil of ["escritorio", "movil"]) {
    const n = `${perfil}${quieto ? "-quieto" : ""}`;
    const { navegador, pagina, errores } = await abrir(chromium, perfil, quieto);
    await pagina.goto(URL, { waitUntil: "load" });

    // 1 · la palomita del logo
    await pagina.waitForTimeout(120);
    const alAbrir = parseFloat(await valor(pagina, ".marca-palomita", "strokeDashoffset"));
    await pagina.waitForTimeout(1100);
    const despues = parseFloat(await valor(pagina, ".marca-palomita", "strokeDashoffset"));
    if (quieto) revisa(alAbrir === 0 && despues === 0, `${n}: el logo sale completo desde el principio (${alAbrir})`);
    else revisa(alAbrir > 1 && Math.abs(despues) < 0.01, `${n}: la palomita empieza sin dibujar (${alAbrir}) y queda completa (${despues})`);
    revisa(await huecoAbierto(pagina), `${n}: por el hueco de la palomita se ve la noche (la máscara recorta)`);
    if (perfil === "escritorio") {
      await pagina.hover(".cabecera .marca");
      // Solo las que corren y no son de CSS: la de al abrir ya terminó, pero se queda en su estado final.
      const animaciones = await pagina.evaluate(
        () => document.querySelector(".marca-palomita").getAnimations().filter((a) => !(a instanceof CSSAnimation) && a.playState === "running").length,
      );
      revisa(quieto ? animaciones === 0 : animaciones === 1, `${n}: con el cursor ${quieto ? "no se mueve" : "se vuelve a dibujar"} (${animaciones})`);
    }

    // 3 · el taco (antes de llegar)
    const clases = await pagina.evaluate(() => [...document.querySelectorAll(".taco-paso")].map((p) => p.className).join(" | "));
    revisa(quieto ? !/espera|cae/.test(clases) : (clases.match(/espera/g) || []).length === 3, `${n}: las hojas ${quieto ? "no esperan" : "esperan abajo"} (${clases})`);
    // El último paso a media pantalla: los tres quedan arriba del 72 % (y arriba de la pastilla).
    await pagina.evaluate(() => {
      const t = document.querySelector(".taco-paso:last-child");
      window.scrollTo(0, t.getBoundingClientRect().top + scrollY - innerHeight * 0.5);
    });
    await pagina.waitForTimeout(1800);
    const taco = await pagina.evaluate(() => ({
      clases: [...document.querySelectorAll(".taco-paso")].map((p) => p.className.replace("taco-paso", "").trim() || "—").join(","),
      hojas: [...document.querySelectorAll(".taco-hoja")].map((h) => +getComputedStyle(h).opacity),
      giro: getComputedStyle(document.querySelector(".taco-paso:nth-child(3) .taco-hoja")).transform,
      sello: +getComputedStyle(document.querySelector(".taco-sello")).opacity,
      trazo: parseFloat(getComputedStyle(document.querySelector(".taco-sello path")).strokeDashoffset),
      rotate: getComputedStyle(document.querySelector(".taco-paso:nth-child(1) .taco-hoja")).rotate,
    }));
    revisa(
      taco.hojas.every((o) => o === 1) && taco.sello === 1 && Math.abs(taco.trazo) < 0.01 && /none|matrix3d\(1, 0, 0, 0, 0, 1/.test(taco.giro),
      `${n}: las 3 hojas a la vista, el sello y su palomita completos (${quieto ? "sin animar" : taco.clases})`,
    );
    revisa(taco.rotate === "-2deg", `${n}: la primera hoja conserva su giro de siempre (${taco.rotate})`);

    // 4 · el precio
    await pagina.evaluate(() => document.getElementById("precio").scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(400);
    await fijarPacientes(pagina, 900);
    await pagina.waitForTimeout(110);
    const aMedias = await pagina.locator(".calc-mes b").textContent();
    const salto = await pagina.evaluate(() => document.querySelector(".calc-mes b").getAnimations().length);
    await pagina.waitForTimeout(600);
    const final = await pagina.locator(".calc-mes b").textContent();
    const texto = await pagina.locator("#pacientes").getAttribute("aria-valuetext");
    if (quieto) revisa(aMedias === "$1,790" && salto === 0, `${n}: el precio cambia de golpe, sin saltito (${aMedias})`);
    else revisa(aMedias !== "$990" && aMedias !== "$1,790" && salto === 1, `${n}: el precio cuenta (${aMedias} a medio camino) y salta al cambiar de escalón`);
    revisa(final === "$1,790" && texto === "900 pacientes al mes: $1,790 al mes", `${n}: llega a ${final} y el lector oye «${texto}»`);

    // 2 · la flecha de WhatsApp (en el cierre: la pastilla ya se acopló y está inerte)
    await pagina.evaluate(() => document.querySelector(".cierre-boton").scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(700);
    if (perfil === "movil") await pagina.tap(".cierre-boton");
    else await pagina.click(".cierre-boton");
    await pagina.waitForTimeout(130);
    // Sin contar la transición del hover (translate 3 px), que ya existía.
    const vuelo = await pagina.evaluate(() => {
      const f = document.querySelector(".cierre-boton svg");
      return { animaciones: f.getAnimations().filter((a) => !(a instanceof CSSTransition)).length, x: new DOMMatrix(getComputedStyle(f).transform).m41 };
    });
    revisa(quieto ? vuelo.animaciones === 0 : vuelo.animaciones === 1 && vuelo.x > 2, `${n}: la flecha ${quieto ? "no se mueve" : `sale (x = ${vuelo.x.toFixed(1)} px)`}`);
    await pagina.waitForTimeout(600);
    revisa(
      await pagina.evaluate(() => {
        const f = document.querySelector(".cierre-boton svg");
        return f.getAnimations().filter((a) => !(a instanceof CSSTransition)).length === 0 && new DOMMatrix(getComputedStyle(f).transform).m41 === 0;
      }),
      `${n}: la flecha regresa a su lugar`,
    );

    // 5 · Moli voltea a ver el botón
    const cara = () =>
      pagina.evaluate(() => {
        const m = document.querySelector(".moli-cierre");
        const ve = (s) => getComputedStyle(m.querySelector(s)).display !== "none";
        return { clases: m.className, guardia: ve(".cara-guardia"), mira: ve(".cara-mira"), abajo: ve(".cara-mira-abajo"), feliz: ve(".cara-feliz") };
      });
    if (perfil === "escritorio") {
      await pagina.mouse.move(5, 5);
      await pagina.hover(".cierre-boton");
      const c = await cara();
      revisa(c.mira && !c.guardia && !c.abajo, `${n}: con el cursor en el botón, Moli lo mira (a su izquierda)`);
      await pagina.mouse.move(5, 5);
      const c2 = await cara();
      revisa(c2.guardia && !c2.mira, `${n}: al quitar el cursor, vuelve a su cara de guardia`);
    } else {
      const c = await cara();
      revisa(c.guardia && !c.mira && !c.abajo, `${n}: tocar el botón en el celular no lo hace voltear (no hay cursor)`);
    }
    // Con el teclado (Tab desde el elemento anterior): en compu mira a la izquierda; en el celular, abajo.
    await pagina.locator(".cierre-boton").evaluate((b) => b.blur());
    await pagina.locator(".cierre-toque").focus();
    await pagina.keyboard.press("Tab");
    const conFoco = await pagina.evaluate(() => document.activeElement?.className);
    const c3 = await cara();
    revisa(conFoco === "cierre-boton" && (perfil === "escritorio" ? c3.mira : c3.abajo), `${n}: con el foco del teclado lo mira (${perfil === "escritorio" ? "izquierda" : "abajo"})`);
    // La cara feliz de cuando lo tocan gana.
    await pagina.evaluate(() => document.querySelector(".moli-cierre").classList.add("contesta"));
    const c4 = await cara();
    revisa(c4.feliz && !c4.mira && !c4.abajo, `${n}: si contesta, gana la cara feliz`);

    revisa(errores.length === 0, `${n}: sin errores de consola${errores.length ? ": " + errores.join(" | ") : ""}`);
    await navegador.close();
  }
}

// WebKit (el motor del iPhone): que la máscara del logo se dibuje de verdad.
{
  const { navegador, pagina, errores } = await abrir(webkit, "movil", false);
  await pagina.goto(URL, { waitUntil: "load" });
  await pagina.waitForTimeout(60);
  const alAbrir = await huecoAbierto(pagina);
  await pagina.waitForTimeout(1200);
  const despues = await huecoAbierto(pagina);
  revisa(!alAbrir && despues, `webkit: el hueco empieza cerrado (${alAbrir ? "abierto" : "cerrado"}) y se abre al dibujarse (${despues ? "abierto" : "cerrado"})`);
  revisa(errores.length === 0, `webkit: sin errores de consola${errores.length ? ": " + errores.join(" | ") : ""}`);
  await navegador.close();
}

console.log(fallas.length ? `\n${fallas.length} falla(s)` : "\nTodo en orden");
process.exitCode = fallas.length ? 1 : 0;
