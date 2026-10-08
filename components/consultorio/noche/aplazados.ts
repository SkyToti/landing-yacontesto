/**
 * La transcripción para lectores de pantalla se calcula después de abrir (R-1, paso 7).
 *
 * Por qué el primer cálculo de diseño (antes de la FCP) tardaba ~520 ms con CPU 4× (trazas del 7-oct a
 * 390 × 844): casi todo eran fuentes. Mientras llegan las de la página, cada tamaño de letra pide su
 * fuente de respaldo (next/font la arma con `local(Arial)`) y Chrome en Windows crea una copia de Arial
 * por tamaño (25 veces, ~7 ms cada una), y el emoji del chat recorre toda la lista de fuentes hasta la de
 * emoji del sistema (12.9 MB). Y la mayor parte de ese texto no se ve al abrir: el primer plano de la
 * noche, los rótulos de las otras pausas y esta transcripción.
 *
 * Aplazar todo lo que no se ve bajaba el primer cálculo a ~290 ms, pero con las fuentes ya cargadas el
 * paso rápido de P2 a P3 pintaba ~8 ms más y cruzaba los 50 ms (causa no aislada: con red lenta no pasa).
 * Diego eligió lo seguro (7-oct): solo la transcripción, que no se pinta nunca. ~60 ms menos y el scroll
 * igual que antes.
 *
 * Con la clase `aplaza` (la pone el guion de arranque junto con `cine`), cada parte de la transcripción
 * va con display: none y aquí se suelta una por rato libre, con el cálculo forzado dentro del rato (la
 * lista con emoji cuesta ~40 ms con CPU 4×; juntas pasarían de 50). Mientras tanto no existe para los
 * lectores de pantalla, como las secciones de después: llega en el primer segundo después de hidratar.
 */
const PIEZAS = "#noche > .solo-lectores > *";

export function soltarAplazados(raiz: HTMLElement): () => void {
  const html = document.documentElement;
  const cola = Array.from(raiz.querySelectorAll<HTMLElement>(PIEZAS));
  const todas = [...cola];
  const termina = () => {
    html.classList.remove("aplaza");
    todas.forEach((p) => p.classList.remove("suelta"));
  };
  if (!html.classList.contains("aplaza")) {
    termina();
    return () => {};
  }

  performance.mark("historia:aplaza");
  // Safari no tiene requestIdleCallback: ahí va un respiro corto entre pieza y pieza.
  const ocioso = typeof window.requestIdleCallback === "function";
  let rato = 0;
  const cancelar = () => (ocioso ? window.cancelIdleCallback(rato) : window.clearTimeout(rato));
  function pedir() {
    // Con la pestaña oculta los ratos libres casi no llegan y nadie ve una tarea larga: todo de golpe.
    if (document.hidden) {
      cola.splice(0).forEach((p) => p.classList.add("suelta"));
      return termina();
    }
    rato = ocioso ? window.requestIdleCallback(siguiente, { timeout: 300 }) : window.setTimeout(siguiente, 24);
  }
  function siguiente() {
    const pieza = cola.shift();
    if (!pieza) {
      termina();
      performance.measure("historia:aplazados", "historia:aplaza");
      return;
    }
    const inicio = performance.now();
    pieza.classList.add("suelta");
    // El cálculo se fuerza aquí, dentro del rato libre: si no, varias piezas caerían en el mismo cuadro.
    void pieza.getBoundingClientRect();
    // Lo que costó cada pieza, para las pruebas de carga (ninguna debe pasar de ~50 ms con CPU 4×).
    performance.measure(`aplazado:${pieza.tagName.toLowerCase()}`, { start: inicio });
    pedir();
  }
  pedir();
  return cancelar;
}
