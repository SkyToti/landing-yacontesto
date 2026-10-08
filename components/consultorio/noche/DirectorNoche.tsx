"use client";

import { useEffect } from "react";
import { soltarAplazados } from "./aplazados";

/**
 * Enciende la escena de las 23:47 solo si la página se cuenta con scroll (clase `cine`, que pone
 * el guion de arranque del layout antes de pintar). GSAP llega en un pedazo aparte, después del
 * primer render: el titular (el LCP) no lo espera. Mientras llega, la transcripción para lectores
 * de pantalla se calcula en ratos libres (`aplazados.ts`).
 */
export function DirectorNoche() {
  useEffect(() => {
    if (!document.documentElement.classList.contains("cine")) return;
    let vivo = true;
    let limpiar: (() => void) | undefined;
    const noche = document.getElementById("noche");
    const cancelarAplazados = noche ? soltarAplazados(noche) : undefined;
    performance.mark("historia:pide");
    import("./director").then(({ armarNoche }) => {
      performance.measure("historia:llega", "historia:pide");
      // Un respiro entre evaluar GSAP y armar la escena: dos tareas cortas en lugar de una larga.
      window.setTimeout(() => {
        const raiz = document.getElementById("noche");
        if (!vivo || !raiz) return;
        performance.mark("historia:armar");
        limpiar = armarNoche(raiz);
        performance.measure("historia:armada", "historia:armar");
        window.__directorVivo = true;
      }, 0);
    });
    return () => {
      vivo = false;
      cancelarAplazados?.();
      limpiar?.();
    };
  }, []);
  return null;
}
