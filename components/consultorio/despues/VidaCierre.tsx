"use client";

import { useEffect } from "react";
import { conectarCalculadora } from "./calculo";
import { CIERRE } from "./textos";

/**
 * Lo poco que se mueve después del día, sin GSAP ni React (la página normal no lo necesita):
 * - la calculadora del precio (conectarCalculadora);
 * - si tocan a Moli en el cierre, salta y contesta con una notita (con movimiento reducido, solo la notita);
 * - la línea viva de ese Moli, solo con la clase `cine` y solo mientras se ve;
 * - la pastilla se acopla al botón grande del cierre y desaparece: nunca hay dos botones a la vez;
 * - pasada la escena, la cabecera lleva fondo para que el texto no pase por debajo de la marca.
 * Sin JavaScript todo se ve quieto y completo: la pastilla se queda y el botón para tocar a Moli no aparece.
 */
export function VidaCierre() {
  useEffect(() => {
    performance.mark("historia:despues-inicia");
    const calculadora = document.querySelector<HTMLElement>("[data-calculadora]");
    const soltarCalculadora = calculadora ? conectarCalculadora(calculadora) : undefined;
    const html = document.documentElement;
    const cierre = document.getElementById("cierre");
    const noche = document.getElementById("noche");
    const pastilla = document.querySelector<HTMLElement>(".pastilla");
    const boton = cierre?.querySelector<HTMLElement>(".cierre-boton");
    const moli = cierre?.querySelector<HTMLElement>(".moli-cierre");
    const toque = cierre?.querySelector<HTMLButtonElement>(".cierre-toque");
    const nota = cierre?.querySelector<HTMLElement>(".nota-cierre");
    if (!cierre || !noche || !pastilla || !boton || !moli || !toque || !nota) return soltarCalculadora;

    const quieto = matchMedia("(prefers-reduced-motion: reduce)");
    const limpiar: (() => void)[] = [];
    if (soltarCalculadora) limpiar.push(soltarCalculadora);

    /* ── Moli contesta si lo tocan ── */
    let cual = 0;
    let suelta = 0;
    toque.hidden = false;
    const alTocar = () => {
      nota.textContent = CIERRE.notas[cual % CIERRE.notas.length];
      cual++;
      // Reiniciar las animaciones de CSS: quitar la clase, forzar el estilo y volver a ponerla.
      moli.classList.remove("contesta", "salta");
      void moli.offsetWidth;
      moli.classList.add("contesta");
      if (!quieto.matches) moli.classList.add("salta");
      window.clearTimeout(suelta);
      suelta = window.setTimeout(() => moli.classList.remove("contesta", "salta"), 1800);
    };
    toque.addEventListener("click", alTocar);
    limpiar.push(() => {
      toque.removeEventListener("click", alTocar);
      window.clearTimeout(suelta);
      toque.hidden = true;
    });

    /* ── Línea viva: solo con la escena encendida y mientras el cierre se ve ── */
    const ruido = moli.querySelector<SVGFETurbulenceElement>("feTurbulence");
    let linea = 0;
    const semillas = [3, 11, 23];
    const vive = (si: boolean) => {
      window.clearInterval(linea);
      if (!si || !ruido || !html.classList.contains("cine") || quieto.matches) return;
      let cuadro = 0;
      linea = window.setInterval(() => {
        if (document.hidden) return;
        cuadro = (cuadro + 1) % 3;
        ruido.setAttribute("seed", String(semillas[cuadro]));
      }, 1000 / 12);
    };
    const verCierre = new IntersectionObserver(([e]) => vive(e.isIntersecting));
    verCierre.observe(moli);
    limpiar.push(() => {
      verCierre.disconnect();
      window.clearInterval(linea);
    });

    /* ── La pastilla se acopla al botón grande ── */
    const acoplar = (si: boolean) => {
      if (si === html.classList.contains("acoplada")) return;
      if (si) {
        // Hacia dónde se va: del centro de la pastilla al centro del botón (una sola medición).
        const p = pastilla.getBoundingClientRect();
        const b = boton.getBoundingClientRect();
        pastilla.style.setProperty("--acople-x", `${Math.round(b.left + b.width / 2 - (p.left + p.width / 2))}px`);
        pastilla.style.setProperty("--acople-y", `${Math.round(b.top + b.height / 2 - (p.top + p.height / 2))}px`);
      }
      html.classList.toggle("acoplada", si);
      pastilla.inert = si;
    };
    // isIntersecting sigue en verdadero con el botón a medias: lo que cuenta es cuánto se ve.
    const verBoton = new IntersectionObserver(([e]) => acoplar(e.intersectionRatio >= 0.6), { threshold: [0, 0.6] });
    verBoton.observe(boton);
    limpiar.push(() => {
      verBoton.disconnect();
      acoplar(false);
    });

    /* ── La cabecera, en cuanto la escena empieza a irse ── */
    // La raíz es una franja en la orilla de abajo: la barra entra cuando el fondo de la noche la cruza (la escena
    // deja de estar fija y sube), no cuando ya se fue. Antes, los últimos textos pasaban por debajo del logo
    // (hallazgo 5 del recorrido del 7-oct; con el globo, el encimado era más ancho).
    const verNoche = new IntersectionObserver(
      ([e]) => html.classList.toggle("pagina", e.boundingClientRect.bottom < (e.rootBounds?.top ?? innerHeight)),
      { rootMargin: "-99% 0px 0px 0px" },
    );
    verNoche.observe(noche);
    limpiar.push(() => {
      verNoche.disconnect();
      html.classList.remove("pagina");
    });

    /*
     * Las piezas de después se calculan en ratos libres, una por vez y en orden. Con content-visibility se
     * saltan al cargar, pero al acercarse el pulgar se calculaban todas en el mismo cuadro: una tarea de 50 a
     * 57 ms con CPU 4× a 15.6 pantallas (r1-scroll --todo, 7-oct). Una por rato libre son unos cuantos ms cada
     * una. Si el pulgar llega antes, el navegador las calcula solo, como sin JavaScript.
     */
    const piezas = Array.from(document.querySelectorAll<HTMLElement>(".despues .seccion, .precio-frase, .calc > *, .cierre-dibujo, .pie"));
    // Safari no tiene requestIdleCallback: ahí va un respiro fijo entre pieza y pieza.
    const ocioso = typeof window.requestIdleCallback === "function";
    let rato = 0;
    const pedir = () => {
      rato = ocioso ? window.requestIdleCallback(siguiente, { timeout: 4000 }) : window.setTimeout(siguiente, 150);
    };
    const siguiente = () => {
      const pieza = piezas.shift();
      if (!pieza) return;
      pieza.style.contentVisibility = "visible";
      pedir();
    };
    const arranque = window.setTimeout(pedir, 1500);
    limpiar.push(() => {
      window.clearTimeout(arranque);
      if (ocioso) window.cancelIdleCallback(rato);
      else window.clearTimeout(rato);
    });

    performance.measure("historia:despues", "historia:despues-inicia");
    return () => limpiar.forEach((f) => f());
  }, []);
  return null;
}
