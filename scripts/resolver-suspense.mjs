// Después de `next build`: deja cada límite de Suspense ya resuelto en su lugar dentro del HTML exportado.
//
// React (Fizz) manda aparte los límites grandes aunque ya estén completos: su contenido queda al final
// del documento en <div hidden id="S:n"> y un guion ($RC) lo mueve a su sitio al cargar. En un sitio
// estático eso no gana nada y cuesta dos cosas: sin JavaScript esas piezas (el precio, el carrusel del
// día, la tira de días) no aparecen, y cualquier analizador las lee fuera de su sección.
//
// Aquí se hace lo mismo que haría $RC, una sola vez: el contenido va entre <!--$--> y <!--/$-->, donde
// React lo espera al hidratar, y se quitan el <div hidden> y su llamada a $RC.
// Uso: node scripts/resolver-suspense.mjs [archivo.html ...]   (por omisión, out/index.html)
import { readFile, writeFile } from "node:fs/promises";

const archivos = process.argv.slice(2).length ? process.argv.slice(2) : ["out/index.html"];

for (const archivo of archivos) {
  let html = await readFile(archivo, "utf8");
  let resueltos = 0;

  for (;;) {
    const segmento = /<div hidden id="S:(\d+)">/.exec(html);
    if (!segmento) break;
    const id = segmento[1];
    const inicio = segmento.index;
    const abre = inicio + segmento[0].length;

    // El cierre de ese <div>, contando los <div> anidados.
    const etiquetas = /<div\b|<\/div>/g;
    etiquetas.lastIndex = abre;
    let profundidad = 1;
    let cierreDiv = -1;
    for (let t = etiquetas.exec(html); t; t = etiquetas.exec(html)) {
      profundidad += t[0] === "</div>" ? -1 : 1;
      if (profundidad === 0) {
        cierreDiv = t.index;
        break;
      }
    }
    if (cierreDiv < 0) throw new Error(`${archivo}: el segmento S:${id} no cierra`);
    const contenido = html.slice(abre, cierreDiv);

    const marcador = `<!--$?--><template id="B:${id}"></template>`;
    const enSuLugar = html.indexOf(marcador);
    if (enSuLugar < 0 || enSuLugar > inicio) throw new Error(`${archivo}: no encontré el lugar de S:${id} (B:${id})`);
    const finLimite = html.indexOf("<!--/$-->", enSuLugar);
    if (finLimite < 0 || finLimite > inicio) throw new Error(`${archivo}: el límite B:${id} no cierra antes de su contenido`);

    // Primero lo que está más abajo (el segmento), para no mover las posiciones de arriba.
    html = html.slice(0, inicio) + html.slice(cierreDiv + "</div>".length);
    // El respaldo que hubiera entre el marcador y el cierre sale; entra el contenido resuelto.
    html = html.slice(0, enSuLugar) + "<!--$-->" + contenido + html.slice(finLimite);

    // La llamada puede ir sola en su <script> o al final del que define $RC: se quita solo la llamada.
    const llamada = `$RC("B:${id}","S:${id}")`;
    const donde = html.indexOf(llamada);
    if (donde < 0) throw new Error(`${archivo}: no encontré la llamada $RC de S:${id}`);
    const conPunto = html[donde - 1] === ";" ? 1 : 0;
    html = (html.slice(0, donde - conPunto) + html.slice(donde + llamada.length)).replace("<script></script>", "");
    resueltos++;
  }

  if (/<template id="B:\d+"><\/template>/.test(html)) throw new Error(`${archivo}: quedó un límite sin resolver`);
  await writeFile(archivo, html);
  console.log(`${archivo}: ${resueltos} límite(s) de Suspense en su lugar`);
}
