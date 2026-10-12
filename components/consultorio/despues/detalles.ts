/**
 * Los detalles del 11-oct-2026, aprobados por Diego después de ver el prototipo
 * (investigacion/detalles-2026-10-11/). Cada uno dice algo y ninguno se mueve solo:
 * - 1 · la palomita del logo se vuelve a dibujar al pasar el cursor por la marca (la de al abrir es de CSS,
 *   base.css);
 * - 2 · la flecha de los botones de WhatsApp «se manda» al tocarlos, como un mensaje que sale;
 * - 3 · cada hoja del taco cae una vez cuando entra a la pantalla, y la del día 7 recibe su sello (CSS,
 *   despues.css: aquí solo se ponen las clases «espera» y «cae» en cada paso);
 * - 5 · Moli voltea a ver «¡Escríbenos!» con el cursor o con el foco del teclado.
 * El 4, el precio que cuenta en vez de brincar, vive en calculo.ts.
 *
 * Como el resto de VidaCierre: sin GSAP ni React, con animaciones de CSS y del navegador (Web Animations).
 * Con «menos movimiento» nada se mueve: el logo y el sello quedan completos y la flecha no sale. Que Moli
 * voltee no es movimiento sino un cambio de cara (como cuando contesta), así que se queda.
 */
export function conectarDetalles(): () => void {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)");
  const fino = matchMedia("(hover: hover) and (pointer: fine)");
  const limpiar: (() => void)[] = [];

  /* ── 1 · La palomita del logo, otra vez con el cursor ── */
  const marca = document.querySelector<HTMLElement>(".cabecera .marca");
  const palomita = marca?.querySelector<SVGPathElement>(".marca-palomita");
  if (marca && palomita) {
    const dibujar = () => {
      if (quieto.matches || !fino.matches) return;
      palomita.animate([{ strokeDashoffset: 1.2 }, { strokeDashoffset: 0 }], {
        duration: 500,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };
    marca.addEventListener("pointerenter", dibujar);
    limpiar.push(() => marca.removeEventListener("pointerenter", dibujar));
  }

  /* ── 2 · La flecha que se manda (al hacer clic o tocar; no al deslizar sobre la pastilla) ── */
  const botones = Array.from(document.querySelectorAll<HTMLElement>(".p-whatsapp, .cierre-boton"));
  const enVuelo = new WeakSet<Element>();
  const mandar = (e: Event) => {
    const flecha = (e.currentTarget as HTMLElement).querySelector("svg");
    if (quieto.matches || !flecha || enVuelo.has(flecha)) return;
    enVuelo.add(flecha);
    // Sale acelerando (160 ms), reaparece atrás sin verse y regresa frenando (280 ms), como en el prototipo.
    const vuelo = flecha.animate(
      [
        { transform: "translateX(0)", opacity: 1, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
        { transform: "translateX(12px)", opacity: 0, offset: 0.36 },
        { transform: "translateX(-10px)", opacity: 0, offset: 0.37, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: 440 },
    );
    vuelo.onfinish = vuelo.oncancel = () => enVuelo.delete(flecha);
  };
  botones.forEach((b) => b.addEventListener("click", mandar));
  limpiar.push(() => botones.forEach((b) => b.removeEventListener("click", mandar)));

  /* ── 3 · Cada hoja del taco cae cuando entra (una vez) ── */
  // Solo las que todavía no se ven al cargar: si ya están en pantalla (llegaron con #instalacion), quietas.
  const pasos = quieto.matches
    ? []
    : Array.from(document.querySelectorAll<HTMLElement>(".taco-paso")).filter((p) => p.getBoundingClientRect().top > innerHeight);
  if (pasos.length) {
    pasos.forEach((p) => p.classList.add("espera"));
    // Cae cuando su orilla de arriba pasa el 72 % de la pantalla: en el celular, arriba de la pastilla.
    const ver = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.replace("espera", "cae");
          ver.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -28% 0px" },
    );
    pasos.forEach((p) => ver.observe(p));
    limpiar.push(() => {
      ver.disconnect();
      pasos.forEach((p) => p.classList.remove("espera"));
    });
  }

  /* ── 5 · Moli voltea a ver «¡Escríbenos!» ── */
  const moli = document.querySelector<HTMLElement>(".moli-cierre");
  const boton = document.querySelector<HTMLElement>(".cierre-boton");
  if (moli && boton) {
    // En compu el botón queda a su izquierda y abajo; en el celular, debajo (despues.css, 900 px).
    const ancho = matchMedia("(min-width: 900px)");
    const voltea = (si: boolean) => {
      moli.classList.toggle("mira", si);
      moli.classList.toggle("abajo", si && !ancho.matches);
    };
    const entra = () => fino.matches && voltea(true);
    const foco = () => boton.matches(":focus-visible") && voltea(true);
    const sale = () => voltea(false);
    boton.addEventListener("pointerenter", entra);
    boton.addEventListener("pointerleave", sale);
    boton.addEventListener("focus", foco);
    boton.addEventListener("blur", sale);
    limpiar.push(() => {
      boton.removeEventListener("pointerenter", entra);
      boton.removeEventListener("pointerleave", sale);
      boton.removeEventListener("focus", foco);
      boton.removeEventListener("blur", sale);
      voltea(false);
    });
  }

  return () => limpiar.forEach((f) => f());
}
