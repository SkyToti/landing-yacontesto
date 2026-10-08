// Dos revisiones de las capas de la escena, cuadro por cuadro, con un pulgar que baja parejo de la noche
// al final del día y luego sube:
// 1. ¿Se asoma el fondo de tinta entre las capas de día? De P7 a P15 multiplica lo transparente de las
//    capas que están prendidas (plano general de día, los primeros planos de las 09:00, las 11:20 y las
//    16:05, y la noche de las 19:00). Si dos capas se cruzan a media opacidad, el producto pasa de 0 y se
//    ve un velo gris (lo que vio Diego el 5-oct al salir de P9). La noche de las 19:00 entra como un iris:
//    solo cuenta como capa que tapa cuando el círculo ya cubre las cuatro esquinas de la pantalla.
// 2. ¿Se ven dos escenas encimadas? En toda la escena, de la noche a las 19:00: una capa a media opacidad
//    con otra prendida debajo se ve como doble imagen (un Moli gigante y gris detrás del celular, dos Anas;
//    el recorrido del 7-oct). Desde el paso 8 los cambios de plano son cortes: nunca debe pasar.
// Uso (con el servidor de out/ en marcha): node scripts/r1-velo.mjs [URL]
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3200/";
const PANTALLAS = 14.75;
const navegador = await chromium.launch();
let falla = false;
for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }, { width: 1920, height: 950 }]) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  await pagina.goto(URL, { waitUntil: "networkidle" });
  await pagina.waitForFunction(() => window.__directorVivo === true, null, { timeout: 30000 });
  await pagina.waitForTimeout(2000);
  const r = await pagina.evaluate(async (total) => {
    const s = document.getElementById("noche");
    const ir = (p) => window.scrollTo(0, s.offsetTop + (p / total) * (s.offsetHeight - innerHeight));
    const capas = [".plano-dia", ".dia-cerca", ".mediodia-cerca", ".tarde-cerca", ".plano-anochecer"].map((q) => s.querySelector(q));
    // Para las encimadas cuentan también las de la noche: su plano general y su primer plano.
    const todas = [".plano-general", ".primer-plano", ".plano-dia", ".dia-cerca", ".mediodia-cerca", ".tarde-cerca"].map((q) => s.querySelector(q));
    const iris = s.querySelector(".anochecer-iris");
    const escenario = s.querySelector(".escenario").getBoundingClientRect();
    const cubre = () => {
      if (getComputedStyle(iris).visibility === "hidden") return 0;
      const r = iris.getBoundingClientRect();
      const [cx, cy, radio] = [r.left + r.width / 2, r.top + r.height / 2, r.width / 2];
      const esquinas = [[escenario.left, escenario.top], [escenario.right, escenario.top], [escenario.left, escenario.bottom], [escenario.right, escenario.bottom]];
      return esquinas.every(([x, y]) => Math.hypot(x - cx, y - cy) <= radio) ? 1 : 0;
    };
    const opacidad = (el) => {
      const c = getComputedStyle(el);
      return c.display === "none" || c.visibility === "hidden" ? 0 : Number(c.opacity);
    };
    const opaca = (el) => (el.classList.contains("plano-anochecer") ? opacidad(el) * cubre() : opacidad(el));
    const cuadro = () => new Promise((res) => requestAnimationFrame(res));
    let peor = { velo: 0, en: 0 };
    let encimada = null;
    const revisa = (p) => {
      if (p >= 5.25) {
        const velo = capas.reduce((t, el) => t * (1 - opaca(el)), 1);
        if (velo > peor.velo) peor = { velo: +velo.toFixed(3), en: +p.toFixed(2) };
      }
      const o = todas.map(opacidad);
      const medias = o.filter((x) => x > 0.02 && x < 0.98).length;
      const prendidas = o.filter((x) => x > 0.02).length;
      if (!encimada && medias >= 1 && prendidas >= 2) encimada = { en: +p.toFixed(2), opacidades: o.map((x) => +x.toFixed(2)) };
    };
    ir(0);
    await new Promise((res) => setTimeout(res, 1500));
    // Un pulgar que baja parejo, ~0.006 pantallas por cuadro...
    for (let p = 0; p <= total - 0.1; p += 0.006) {
      ir(p);
      await cuadro();
      revisa(p);
    }
    // ...y de regreso, hacia arriba: los cruces se deshacen en orden inverso.
    for (let p = total - 0.1; p >= 0; p -= 0.006) {
      ir(p);
      await cuadro();
      revisa(p);
    }
    return { ...peor, encimada };
  }, PANTALLAS);
  console.log(`${viewport.width} px: el fondo se asoma hasta ${Math.round(r.velo * 100)} % (en ${r.en} pantallas)`);
  console.log(
    r.encimada
      ? `${viewport.width} px: dos capas encimadas en ${r.encimada.en} pantallas (opacidades ${r.encimada.opacidades.join(" · ")})`
      : `${viewport.width} px: nunca hay dos capas encimadas`,
  );
  if (r.velo > 0.02 || r.encimada) falla = true;
  await contexto.close();
}
await navegador.close();
if (falla) {
  console.log("Falla: hay velo o dos capas encimadas.");
  process.exitCode = 1;
} else console.log("Sin velo y sin capas encimadas: cada cambio de plano es un corte.");
