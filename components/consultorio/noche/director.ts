import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { dedo, rasgos, type Boca, type Cara } from "../moli/partes";

/**
 * El director de la escena de las 23:47. Dos relojes, como en la hoja de Moli:
 * - el SCROLL mueve la cámara (plano general ↔ primer plano), atado al pulgar;
 * - cada PAUSA dispara una actuación con su propio tiempo (Moli salta, habla, señala; llegan
 *   los mensajes; la cita se pinta). Una actuación a medio scroll se ve de títere.
 * El scroll se asienta en cada pausa para que cada momento se pueda leer.
 *
 * Regla de la hoja: cada propiedad tiene UN dueño. La cámara mueve `.lamina`, `.plano-general`
 * y `.primer-plano`; las actuaciones mueven todo lo de adentro.
 */

/** Alto de la escena en pantallas de scroll, y dónde se asienta cada pausa (P0 a P6). */
const PANTALLAS = 4.75;
const PAUSAS = [0, 1.0, 1.7, 2.35, 3.05, 3.7, 4.5];
/** Cuántos mensajes del chat se ven en cada pausa. */
const BURBUJAS = [0, 2, 3, 4, 5, 6, 6];
/** En el celular la hoja tapa el chat: solo sube cuando Moli revisa (P2) y cuando agenda (P4). */
const HOJA_CELULAR = [false, false, true, false, true, false, false];
const HOJA_ESCRITORIO = [false, false, true, true, true, true, false];
/** La cara de Moli (primer plano) en reposo en cada pausa. */
const CARAS: Cara[] = ["dormita", "normal", "concentra", "guino", "feliz", "feliz", "dormita"];
const TAPADA = "inset(0% 0% 0% 100%)";
const DESTAPADA = "inset(0% 0% 0% 0%)";

function crearMoli(el: HTMLElement, prefijo: string, inicial: Cara) {
  const g = el.querySelector<SVGGElement>(".rasgos-cine")!;
  const onda = el.querySelector<HTMLElement>(".moli-onda")!;
  const ruido = el.querySelector<SVGFETurbulenceElement>("feTurbulence")!;
  let cara = inicial;
  const pintar = (c: Cara, boca?: Boca) => {
    g.innerHTML = rasgos(prefijo, c, boca);
  };
  const ondear = (tl: gsap.core.Timeline, t: number) =>
    tl.fromTo(onda, { scale: 0.25, autoAlpha: 1 }, { scale: 1.9, autoAlpha: 0, duration: 0.65, ease: "power2.out" }, t);
  return {
    el,
    ruido,
    ondear,
    /** Cambia de cara solo si es otra (cada cambio redibuja la cara, no a Moli). */
    cara(c: Cara) {
      if (c === cara) return;
      cara = c;
      pintar(c);
    },
    /** Salto de caricatura: anticipa, se estira, aterriza y rebota. Solo `transform`. */
    salto(tl: gsap.core.Timeline, t: number) {
      tl.to(el, { scaleY: 0.86, scaleX: 1.08, duration: 0.12, ease: "power2.out" }, t)
        .to(el, { scaleY: 1.1, scaleX: 0.94, yPercent: -13, duration: 0.16, ease: "power2.out" })
        .to(el, { scaleY: 0.94, scaleX: 1.05, yPercent: 0, duration: 0.14, ease: "power2.in" })
        .to(el, { scaleY: 1, scaleX: 1, duration: 0.55, ease: "elastic.out(1, 0.4)" });
    },
    /** Habla por cuadros (la boca cambia cada 0.11 s) y del micrófono sale la onda. */
    habla(tl: gsap.core.Timeline, t: number, final: Cara, cuadros = 7) {
      const bocas: Boca[] = ["abierta", "o", "linea", "abierta", "sonrisa", "o"];
      for (let i = 0; i < cuadros; i++) tl.call(() => pintar("normal", bocas[i % bocas.length]), undefined, t + i * 0.11);
      tl.call(() => ((cara = final), pintar(final)), undefined, t + cuadros * 0.11);
      ondear(tl, t + 0.05);
    },
    /** Quita lo que haya quedado a medias de una actuación. */
    quieto(c: Cara) {
      gsap.set(el, { scaleX: 1, scaleY: 1, yPercent: 0 });
      gsap.set(onda, { autoAlpha: 0 });
      cara = c;
      pintar(c);
    },
  };
}

export function armarNoche(raiz: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;
  const qq = <T extends Element = HTMLElement>(s: string) => Array.from(raiz.querySelectorAll<T>(s));

  const escenario = q(".escenario");
  const general = q(".plano-general");
  const lamina = q(".lamina");
  const cerca = q(".primer-plano");
  const rotulos = qq(".rotulo");
  const burbujas = qq(".burbuja");
  const chat = q(".chat");
  const chatCaja = q(".tel-chat");
  const hoja = q(".hoja");
  const equis = q<SVGPathElement>(".equis path");
  const pedida = q('[data-blq="pedida"]');
  const libres = qq('[data-blq^="libre"]');
  const cita = q(".blq-cita");
  const palomita = q(".palomita");
  const mano = q(".mano-cerca");
  const dedoPath = q<SVGPathElement>(".mano-cerca .dedo");
  const notaYo = q(".nota-yo");
  const notaListo = q(".nota-listo");
  const notif = q(".notif");
  const notaQuien = q(".nota-quien");
  const luzGrande = q(".luz-grande");
  const luzChica = q(".luz-chica");
  const moliG = crearMoli(q('[data-moli="mg"]'), "mg-c", "dormita");
  const moliC = crearMoli(q('[data-moli="mc"]'), "mc-c", "dormita");

  const escritorio = matchMedia("(min-width: 900px)");
  let pausa = -1;
  let activa = false;
  let actuacion: gsap.core.Timeline | null = null;
  let reponer = () => {};

  const ctx = gsap.context(() => {
    /* ── La cámara, atada al scroll ── */
    const camara = gsap.timeline({ defaults: { ease: "none" } });
    camara
      .set({}, {}, PANTALLAS)
      // Empujón al celular: el plano general crece hacia él y se funde con el primer plano.
      .fromTo(lamina, { scale: 1 }, { scale: 2.3, ease: "power2.in", duration: 0.72 }, 0.18)
      .fromTo(general, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.28 }, 0.62)
      .fromTo(cerca, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.4 }, 0.58)
      // De regreso al plano general: la noche sigue y Moli vuelve a su guardia.
      .to(cerca, { autoAlpha: 0, scale: 0.92, ease: "power2.in", duration: 0.32 }, 3.86)
      .fromTo(lamina, { scale: 2.3 }, { scale: 1, ease: "power2.out", duration: 0.55, immediateRender: false }, 3.9)
      .to(general, { autoAlpha: 1, duration: 0.3 }, 3.9);

    const mitades = PAUSAS.slice(1).map((p, i) => (PAUSAS[i] + p) / 2);
    const pausaEn = (progreso: number) => {
      const pos = progreso * PANTALLAS;
      let k = 0;
      while (k < mitades.length && pos >= mitades[k]) k++;
      return k;
    };

    const st = ScrollTrigger.create({
      trigger: raiz,
      start: "top top",
      end: "bottom bottom",
      animation: camara,
      scrub: 0.5,
      // Se asienta en la pausa más cercana a donde el scroll de verdad se detuvo: ni «la siguiente»
      // (directional) ni adonde proyecta la velocidad (inertia). El celular ya trae su propia inercia.
      snap: {
        snapTo: [...PAUSAS.map((p) => p / PANTALLAS), 1],
        directional: false,
        inertia: false,
        duration: { min: 0.3, max: 0.8 },
        delay: 0.12,
        ease: "power2.inOut",
      },
      onUpdate: (self) => irA(pausaEn(self.progress)),
      onToggle: (self) => {
        activa = self.isActive;
      },
    });

    /* ── Estados de reposo: lo que se ve quieto en cada pausa ── */
    const hojaArriba = (k: number) => (escritorio.matches ? HOJA_ESCRITORIO : HOJA_CELULAR)[k];
    // Sin tocar el centrado del CSS: en escritorio la hoja entra de lado y en el celular sube desde abajo.
    const hojaFuera = () => (escritorio.matches ? { x: 48, autoAlpha: 0 } : { yPercent: 118, autoAlpha: 0 });
    const hojaDentro = () => (escritorio.matches ? { x: 0, autoAlpha: 1 } : { yPercent: 0, autoAlpha: 1 });

    function desplazamiento(n: number) {
      if (n === 0) return 0;
      const ultima = burbujas[n - 1];
      const estilo = getComputedStyle(chatCaja);
      const disponible = chatCaja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
      // Como en WhatsApp: el último mensaje queda abajo y empuja a los anteriores hacia arriba.
      return disponible - (ultima.offsetTop + ultima.offsetHeight);
    }

    /** La mano sale del pecho de Moli; el dedo mide lo que haga falta para tocar el bloque. */
    const largo = { l: 92 };
    const pintaDedo = () => dedoPath.setAttribute("d", dedo(largo.l));
    function apunte(objetivo: HTMLElement) {
      const e = escenario.getBoundingClientRect();
      const m = moliC.el.getBoundingClientRect();
      const r = objetivo.getBoundingClientRect();
      const k = mano.offsetWidth / 500;
      // La base del dedo (x = 100 en la mano) queda frente a la panza de Moli: así el dedo tiene
      // largo para estirarse aunque Moli esté pegado a la hoja.
      const izquierda = m.left - e.left + m.width * 0.45 - 350 * k;
      const tx = r.right - e.left + 2;
      const ty = r.top - e.top + r.height / 2;
      return { x: izquierda, y: ty - 70 * k, l: gsap.utils.clamp(92, 330, 344 - (tx - izquierda) / k) };
    }

    function estado(k: number) {
      const n = BURBUJAS[k];
      burbujas.forEach((b, i) => gsap.set(b, { autoAlpha: i < n ? 1 : 0, scale: 1, y: 0 }));
      gsap.set(chat, { y: desplazamiento(n) });
      gsap.set(hoja, hojaArriba(k) ? hojaDentro() : hojaFuera());
      gsap.set(equis, { strokeDashoffset: k >= 2 ? 0 : 40 });
      // Con la cita puesta, las 11:00 ya chocan con ella: lo libre se apaga.
      gsap.set(libres, { scale: 1, autoAlpha: k >= 4 ? 0 : 1 });
      gsap.set(cita, { clipPath: k >= 4 ? DESTAPADA : TAPADA });
      gsap.set(palomita, { autoAlpha: k >= 4 ? 1 : 0, scale: 1 });
      if (k === 2 && hojaArriba(2)) {
        const a = apunte(libres[0]);
        gsap.set(mano, { x: a.x, y: a.y, autoAlpha: 1, scale: 1 });
        largo.l = a.l;
      } else {
        gsap.set(mano, { autoAlpha: 0 });
        largo.l = 92;
      }
      pintaDedo();
      gsap.set(notaYo, { autoAlpha: k === 1 ? 1 : 0, clipPath: DESTAPADA });
      gsap.set(notaListo, { autoAlpha: k === 4 || k === 5 ? 1 : 0, clipPath: DESTAPADA });
      moliC.quieto(CARAS[k]);
      // El plano general: de ida, el mensaje espera; de vuelta (P6) ya se contestó y la luz se cierra.
      gsap.set([notif, notaQuien], { autoAlpha: k <= 1 ? 1 : 0 });
      gsap.set(luzGrande, { autoAlpha: k === 6 ? 0 : 1 });
      gsap.set(luzChica, { autoAlpha: k === 6 ? 1 : 0 });
      moliG.quieto("dormita");
    }
    reponer = () => {
      if (pausa >= 0) estado(pausa);
    };

    /* ── Actuaciones: lo que pasa al llegar a cada pausa, con su propio tiempo ── */
    function escribe(tl: gsap.core.Timeline, nota: HTMLElement, t: number) {
      tl.fromTo(nota, { autoAlpha: 1, clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: DESTAPADA, duration: 0.42, ease: "steps(5)" }, t);
    }
    function llega(tl: gsap.core.Timeline, i: number, t: number) {
      const b = burbujas[i];
      const paciente = b.classList.contains("de-paciente");
      tl.fromTo(
        b,
        { autoAlpha: 0, scale: 0.55, y: 10, transformOrigin: paciente ? "0% 100%" : "100% 100%" },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2)" },
        t,
      );
      tl.to(chat, { y: () => desplazamiento(i + 1), duration: 0.45, ease: "power3.out" }, t);
    }
    function subeHoja(tl: gsap.core.Timeline, t: number) {
      tl.fromTo(hoja, hojaFuera(), { ...hojaDentro(), duration: 0.55, ease: "power3.out" }, t);
    }
    function bajaHoja(tl: gsap.core.Timeline, t: number) {
      if (!hojaArriba(pausa)) tl.to(hoja, { ...hojaFuera(), duration: 0.42, ease: "power2.in" }, t);
    }
    function senala(tl: gsap.core.Timeline, objetivo: HTMLElement, t: number) {
      tl.to(mano, { x: () => apunte(objetivo).x, y: () => apunte(objetivo).y, duration: 0.3, ease: "power2.inOut" }, t);
      tl.to(largo, { l: () => apunte(objetivo).l, duration: 0.42, ease: "back.out(1.6)", onUpdate: pintaDedo }, t + 0.08);
    }

    const ENTRADAS: Record<number, (tl: gsap.core.Timeline) => void> = {
      // P1: Moli despierta, salta y contesta.
      1: (tl) => {
        tl.call(() => moliC.cara("sorpresa"), undefined, 0);
        moliC.salto(tl, 0.08);
        escribe(tl, notaYo, 0.3);
        llega(tl, 0, 0.05);
        moliC.habla(tl, 0.55, "feliz");
        llega(tl, 1, 0.75);
        tl.call(() => moliC.cara("normal"), undefined, 1.9);
      },
      // P2: llega «mañana a las 10», sube la agenda y Moli señala lo ocupado y lo libre.
      2: (tl) => {
        tl.to(notaYo, { autoAlpha: 0, duration: 0.2 }, 0);
        llega(tl, 2, 0);
        tl.call(() => moliC.cara("concentra"), undefined, 0.2);
        subeHoja(tl, 0.35);
        tl.set(mano, { autoAlpha: 1, x: () => apunte(pedida).x, y: () => apunte(pedida).y, scale: 0.3, transformOrigin: "75% 50%" }, 0.95);
        tl.call(() => {
          largo.l = 92;
          pintaDedo();
        }, undefined, 0.95);
        tl.to(mano, { scale: 1, duration: 0.35, ease: "back.out(2.2)" }, 0.95);
        tl.to(largo, { l: () => apunte(pedida).l, duration: 0.45, ease: "back.out(1.6)", onUpdate: pintaDedo }, 1.15);
        tl.to(equis, { strokeDashoffset: 0, duration: 0.32, ease: "steps(4)" }, 1.55);
        senala(tl, libres[0], 2.1);
        tl.to(libres, { scale: 1.06, duration: 0.16, yoyo: true, repeat: 3, ease: "power1.inOut", stagger: 0.08 }, 2.45);
      },
      // P3: guarda la mano, baja la agenda y ofrece lo libre.
      3: (tl) => {
        tl.to(largo, { l: 92, duration: 0.18, ease: "power2.in", onUpdate: pintaDedo }, 0);
        tl.to(mano, { scale: 0.3, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.12);
        bajaHoja(tl, 0.1);
        moliC.habla(tl, 0.45, "guino");
        llega(tl, 3, 0.6);
      },
      // P4: llega el nombre, sube la agenda y la cita se pinta de verde desde el lado de Moli.
      4: (tl) => {
        llega(tl, 4, 0);
        tl.call(() => moliC.cara("concentra"), undefined, 0.15);
        if (!escritorio.matches) subeHoja(tl, 0.4);
        moliC.ondear(tl, 0.95);
        tl.fromTo(cita, { clipPath: TAPADA }, { clipPath: DESTAPADA, duration: 0.7, ease: "power2.out" }, 1.0);
        tl.to(libres, { autoAlpha: 0, duration: 0.3, ease: "steps(3)" }, 1.3);
        tl.fromTo(palomita, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, 1.55);
        tl.call(() => moliC.cara("feliz"), undefined, 1.6);
        moliC.salto(tl, 1.6);
        escribe(tl, notaListo, 1.9);
      },
      // P5: baja la agenda y le confirma a Mariana.
      5: (tl) => {
        bajaHoja(tl, 0);
        moliC.habla(tl, 0.35, "feliz");
        llega(tl, 5, 0.5);
      },
      // P6: de vuelta al plano general, Moli bosteza, la luz se cierra y vuelve a dormitar de guardia.
      6: (tl) => {
        tl.call(() => moliG.cara("bosteza"), undefined, 0.45)
          .to(luzGrande, { autoAlpha: 0, duration: 0.5, ease: "steps(3)" }, 0.6)
          .to(luzChica, { autoAlpha: 1, duration: 0.5, ease: "steps(3)" }, 0.6)
          .call(() => moliG.cara("dormita"), undefined, 1.3);
      },
    };

    function irA(k: number) {
      if (k === pausa) return;
      const antes = pausa;
      pausa = k;
      raiz.dataset.pausa = String(k);
      actuacion?.progress(1).kill();
      actuacion = null;
      if (antes >= 0 && k > antes && ENTRADAS[k]) {
        // Si saltó varias pausas de golpe, se acomoda en la anterior y actúa solo la última.
        estado(k - 1);
        actuacion = gsap.timeline();
        ENTRADAS[k](actuacion);
      } else {
        estado(k);
      }
      cambiaRotulo(antes, k);
    }

    function cambiaRotulo(antes: number, k: number) {
      rotulos.forEach((r, i) => {
        // Al arrancar no se anima nada: el titular ya está pintado desde el HTML (y es el LCP).
        if (antes < 0) gsap.set(r, { opacity: i === k ? 1 : 0 });
        else if (i === k) gsap.fromTo(r, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.12, ease: "power3.out", overwrite: true });
        else if (i === antes) gsap.to(r, { opacity: 0, y: -10, duration: 0.25, ease: "power2.in", overwrite: true });
        else gsap.set(r, { opacity: 0 });
      });
    }

    // Arranque: la pausa donde ya esté el scroll (al recargar a media escena), sin actuar.
    activa = st.isActive;
    irA(pausaEn(st.progress));
  }, raiz);

  /* ── Línea viva: el trazo de Moli tiembla a 12 cuadros por segundo, solo el que está a cuadro ── */
  let cuadro = 0;
  const semillas = [3, 11, 23];
  const linea = window.setInterval(() => {
    if (!activa || document.hidden) return;
    cuadro = (cuadro + 1) % 3;
    const visible = pausa >= 1 && pausa <= 5 ? moliC : moliG;
    visible.ruido.setAttribute("seed", String(semillas[cuadro]));
  }, 1000 / 12);

  // Al cruzar el corte de escritorio la hoja cambia de lugar: se recalcula el reposo.
  const alCambiarTamano = () => {
    actuacion?.progress(1).kill();
    actuacion = null;
    ScrollTrigger.refresh();
    reponer();
  };
  escritorio.addEventListener("change", alCambiarTamano);

  return () => {
    window.clearInterval(linea);
    escritorio.removeEventListener("change", alCambiarTamano);
    actuacion?.kill();
    ctx.revert();
  };
}
