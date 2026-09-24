"use client";

import { useEffect } from "react";

/**
 * El Director arma la historia con GSAP sin competir con la carga:
 * - en un momento ocioso después de cargar, solo descarga su código (GSAP y los plugins);
 * - con el primer gesto del visitante (scroll, toque, tecla, clic) arma las escenas, en pasos
 *   cortos que ceden el hilo.
 * Mientras tanto la portada ya se ve y se usa (el cilindro y el titular no dependen de GSAP), y
 * el alto de cada escena ya está puesto por CSS: nada brinca cuando la historia se arma.
 */
export function Director() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (!raiz.classList.contains("cine")) return;
    window.__directorVivo = true;
    let arrancado = false;
    let cancelado = false;
    let deshacer: (() => void) | undefined;
    let espera = 0;
    let ocio = 0;
    const cargar = () => import("./director/armar");

    const gestos = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    const quitarGestos = () => gestos.forEach((g) => window.removeEventListener(g, arrancar));

    function arrancar() {
      if (arrancado) return;
      arrancado = true;
      quitarGestos();
      cargar()
        .then(({ armarHistoria }) => armarHistoria())
        .then((fn) => {
          if (cancelado) fn();
          else deshacer = fn;
        })
        .catch((error) => {
          // Si algo falla, la historia se queda quieta y completa: mejor que a medias.
          console.warn("La historia animada no arrancó; se muestra la versión quieta.", error);
          raiz.classList.remove("cine");
        });
    }

    gestos.forEach((g) => window.addEventListener(g, arrancar, { passive: true }));
    // Si la página ya viene desplazada (recarga, ancla), la historia se arma de inmediato.
    if (window.scrollY > 0) arrancar();

    const precargar = () => {
      espera = window.setTimeout(() => {
        // Primero GSAP; luego, en otro momento ocioso, se maqueta el teléfono de la noche (lo
        // único pesado de la escena), para que el primer gesto no tenga que hacerlo.
        const maquetarTelefono = () => {
          const tel = document.getElementById("tel-noche");
          if (tel) tel.style.contentVisibility = "visible";
        };
        const bajar = () =>
          void cargar()
            .then((m) => m.precargarHistoria())
            .then(() => {
              if ("requestIdleCallback" in window) window.requestIdleCallback(maquetarTelefono, { timeout: 4000 });
              else maquetarTelefono();
            });
        if ("requestIdleCallback" in window) ocio = window.requestIdleCallback(bajar, { timeout: 3000 });
        else bajar();
      }, 1500);
    };
    if (document.readyState === "complete") precargar();
    else window.addEventListener("load", precargar, { once: true });

    return () => {
      cancelado = true;
      quitarGestos();
      window.removeEventListener("load", precargar);
      window.clearTimeout(espera);
      if (ocio && "cancelIdleCallback" in window) window.cancelIdleCallback(ocio);
      deshacer?.();
    };
  }, []);

  return null;
}
