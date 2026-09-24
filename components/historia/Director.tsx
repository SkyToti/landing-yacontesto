"use client";

import { useEffect } from "react";

/**
 * El Director arma la historia con GSAP cuando la página ya pintó. Carga GSAP y sus plugins
 * aparte (no están en el camino crítico) y, si la historia quieta es la que va, no hace nada.
 */
export function Director() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (!raiz.classList.contains("cine")) return;
    let deshacer: (() => void) | undefined;
    let cancelado = false;
    import("./director/armar").then(({ armarHistoria }) => {
      if (cancelado) return;
      armarHistoria()
        .then((fn) => {
          if (cancelado) fn();
          else deshacer = fn;
        })
        .catch((error) => {
          // Si algo falla, la historia se queda quieta y completa: mejor que a medias.
          console.warn("La historia animada no arrancó; se muestra la versión quieta.", error);
          raiz.classList.remove("cine");
        });
    });
    return () => {
      cancelado = true;
      deshacer?.();
    };
  }, []);

  return null;
}
