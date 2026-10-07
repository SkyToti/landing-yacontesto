// ¿Se asoma el fondo de tinta entre las capas de día? Recorre de día con el scroll (de P7 a P15) y, en
// cada cuadro, multiplica lo transparente de las capas que están prendidas (plano general de día, los
// primeros planos de las 09:00, las 11:20 y las 16:05, y la noche de las 19:00). Si dos capas se cruzan a media
// opacidad, el producto pasa de 0 y se ve un velo gris con doble imagen (lo que vio Diego el 5-oct al salir de P9).
// La noche de las 19:00 entra como un iris: solo cuenta como capa que tapa cuando el círculo ya cubre las cuatro
// esquinas de la pantalla (mientras crece, lo de abajo tiene que seguir completo).
// Uso (con el servidor de out/ en marcha): node scripts/r1-velo.mjs [URL]
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
const PANTALLAS = 14.75;
const navegador = await chromium.launch();
let falla = false;
for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  await pagina.goto(URL, { waitUntil: "networkidle" });
  await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
  await pagina.waitForTimeout(2000);
  const r = await pagina.evaluate(async (total) => {
    const s = document.getElementById("noche");
    const ir = (p) => window.scrollTo(0, s.offsetTop + (p / total) * (s.offsetHeight - innerHeight));
    const capas = [".plano-dia", ".dia-cerca", ".mediodia-cerca", ".tarde-cerca", ".plano-anochecer"].map((q) => s.querySelector(q));
    const iris = s.querySelector(".anochecer-iris");
    const escenario = s.querySelector(".escenario").getBoundingClientRect();
    const cubre = () => {
      if (getComputedStyle(iris).visibility === "hidden") return 0;
      const r = iris.getBoundingClientRect();
      const [cx, cy, radio] = [r.left + r.width / 2, r.top + r.height / 2, r.width / 2];
      const esquinas = [[escenario.left, escenario.top], [escenario.right, escenario.top], [escenario.left, escenario.bottom], [escenario.right, escenario.bottom]];
      return esquinas.every(([x, y]) => Math.hypot(x - cx, y - cy) <= radio) ? 1 : 0;
    };
    const opaca = (el) => {
      const c = getComputedStyle(el);
      if (c.display === "none" || c.visibility === "hidden") return 0;
      return el.classList.contains("plano-anochecer") ? Number(c.opacity) * cubre() : Number(c.opacity);
    };
    const cuadro = () => new Promise((res) => requestAnimationFrame(res));
    ir(5.25);
    await new Promise((res) => setTimeout(res, 1500));
    let peor = { velo: 0, en: 0 };
    // Un pulgar que baja parejo, ~0.006 pantallas por cuadro.
    for (let p = 5.25; p <= total - 0.1; p += 0.006) {
      ir(p);
      await cuadro();
      const velo = capas.reduce((t, el) => t * (1 - opaca(el)), 1);
      if (velo > peor.velo) peor = { velo: +velo.toFixed(3), en: +p.toFixed(2) };
    }
    // Y de regreso, hacia arriba: los cruces se deshacen en orden inverso.
    for (let p = total - 0.1; p >= 5.25; p -= 0.006) {
      ir(p);
      await cuadro();
      const velo = capas.reduce((t, el) => t * (1 - opaca(el)), 1);
      if (velo > peor.velo) peor = { velo: +velo.toFixed(3), en: +p.toFixed(2) };
    }
    return peor;
  }, PANTALLAS);
  console.log(`${viewport.width} px: el fondo se asoma hasta ${Math.round(r.velo * 100)} % (en ${r.en} pantallas)`);
  if (r.velo > 0.02) falla = true;
  await contexto.close();
}
await navegador.close();
if (falla) {
  console.log("Hay velo: dos capas de día se cruzan a media opacidad.");
  process.exitCode = 1;
} else console.log("Sin velo: siempre hay una capa opaca debajo.");
