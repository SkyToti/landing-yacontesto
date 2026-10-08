import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { armarAnochecer } from "../dia/anochecer";
import { armarManana } from "../dia/manana";
import { armarMediodia } from "../dia/mediodia";
import { armarTarde } from "../dia/tarde";
import { type Cara } from "../moli/partes";
import { crearMoli } from "../moli/titere";
import { PANTALLAS, PAUSAS, T1, T5 } from "../pausas";
import { PUNTOS } from "./dibujo";

/**
 * El director de la escena fija: las 23:47 (aquí) y, con el mismo sistema, los actos de día: la
 * transición T1 y las 09:00 (`../dia/manana.ts`), la T2 y las 11:20 (`../dia/mediodia.ts`) y la T3
 * y las 16:05 (`../dia/tarde.ts`), y la T4, la T5 y las 19:00, cuando la noche vuelve (`../dia/anochecer.ts`).
 * Dos relojes, como en la hoja de Moli:
 * - el SCROLL mueve la cámara (plano general ↔ primer plano), atado al pulgar;
 * - cada PAUSA dispara una actuación con su propio tiempo (Moli salta, habla, señala; llegan
 *   los mensajes; la cita se pinta). Una actuación a medio scroll se ve de títere.
 * El scroll se asienta en cada pausa para que cada momento se pueda leer.
 *
 * Regla de la hoja: cada propiedad tiene UN dueño. La cámara mueve `.lamina`, `.plano-general`
 * y `.primer-plano`; las actuaciones mueven todo lo de adentro.
 */

/** Un acto de día: su parte de la cámara, su reposo por pausa, sus actuaciones y su Moli a cuadro. */
type Acto = {
  camara: (tl: gsap.core.Timeline) => void;
  estado: (pausa: number) => void;
  entradas: Record<string, (tl: gsap.core.Timeline) => void>;
  /** El Moli a cuadro en esa pausa; null si no hay ninguno; undefined si la pausa no es de este acto. */
  moliEn: (k: number) => ReturnType<typeof crearMoli> | null | undefined;
  reponer: () => void;
};
/** Los actos de día, en orden. Cada uno se arma en su propia tarea, después de la noche. */
const ARMADORES = [
  { nombre: "dia", armar: armarManana },
  { nombre: "mediodia", armar: armarMediodia },
  { nombre: "tarde", armar: armarTarde },
  { nombre: "anochecer", armar: armarAnochecer },
];

/** Lo de la noche se indexa por pausa de P0 a P6; de P7 en adelante la noche se queda como en P6. */
const ULTIMA_NOCHE = 6;
/** Cuántos mensajes del chat se ven en cada pausa. */
const BURBUJAS = [0, 2, 3, 4, 5, 6, 6];
/** En el celular la hoja tapa el chat: solo sube cuando Moli revisa (P2) y cuando agenda (P4). */
const HOJA_CELULAR = [false, false, true, false, true, false, false];
const HOJA_ESCRITORIO = [false, false, true, true, true, true, false];
/** La cara de Moli (primer plano) en reposo en cada pausa. */
const CARAS: Cara[] = ["dormita", "normal", "concentra", "guino", "feliz", "feliz", "dormita"];
const TAPADA = "inset(0% 0% 0% 100%)";
const DESTAPADA = "inset(0% 0% 0% 0%)";

export function armarNoche(raiz: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const q = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s)!;
  const qq = <T extends Element = HTMLElement>(s: string) => Array.from(raiz.querySelectorAll<T>(s));

  const escenario = q(".escenario");
  const general = q(".plano-general");
  const lamina = general.querySelector<HTMLElement>(".lamina")!;
  const cerca = q(".primer-plano");
  // Lo del primer plano de la noche se busca solo ahí: el de día tiene su propio chat, agenda y cita.
  const qc = <T extends Element = HTMLElement>(s: string) => cerca.querySelector<T>(s)!;
  const qqc = <T extends Element = HTMLElement>(s: string) => Array.from(cerca.querySelectorAll<T>(s));
  const rotulos = qq(".rotulo");
  const burbujas = qqc(".burbuja");
  const chat = qc(".chat");
  const chatCaja = qc(".tel-chat");
  const hoja = qc(".hoja");
  const rejilla = qc(".hoja .hoja-rejilla");
  const lupa = q(".lupa-cerca");
  const vidrio = q(".lupa-vidrio");
  const copia = q(".lupa-copia");
  const lente = q<SVGCircleElement>(".lupa-cerca .lente");
  const lapiz = q(".lapiz-cerca");
  const punta = q<SVGCircleElement>(".lapiz-cerca .punta");
  // La agenda aumentada dentro de la lupa es una copia de la rejilla: las animaciones tocan las dos.
  copia.replaceChildren(rejilla.cloneNode(true));
  const rejillaCopia = copia.firstElementChild as HTMLElement;
  const equis = qqc<SVGPathElement>(".equis path");
  // En las 10:00 la lente abarca el bloque entero: la ✗ y el texto.
  const pedida = q('.hoja [data-blq="pedida"]');
  const libre1030 = q('.hoja [data-blq="libre-1030"] span');
  const libre1100 = q('.hoja [data-blq="libre-1100"] span');
  const libres = qqc(".blq-libre");
  const citaHoja = qc(".hoja .blq-cita");
  const citas = qqc(".blq-cita");
  const palomitas = qqc(".palomita");
  const notaYo = q(".nota-yo");
  const notaListo = q(".nota-listo");
  const notif = q(".notif");
  const notaQuien = q(".nota-quien");
  const luzGrande = q(".luz-grande");
  const iris = q(".iris");
  const irisContenido = q(".iris-contenido");
  const luzChica = q(".luz-chica");
  const moliG = crearMoli(q('[data-moli="mg"]'), "mg-c", "dormita");
  const moliC = crearMoli(q('[data-moli="mc"]'), "mc-c", "dormita");

  const escritorio = matchMedia("(min-width: 900px)");
  /** De día la marca y la pastilla se invierten (tinta sobre el papel); a las 19:00 vuelven a la noche. */
  const amanecer = (si: boolean) => document.documentElement.classList.toggle("dia", si);
  const esDeDia = (self: ScrollTrigger) => {
    const pos = self.progress * PANTALLAS;
    return self.isActive && pos >= T1.amanece && pos < T5.anochece;
  };
  let pausa = -1;
  let activa = false;
  let actuacion: gsap.core.Timeline | null = null;
  let reponer = () => {};

  /** Los actos de día: llegan en tareas aparte, un instante después de la noche. */
  const actos: Acto[] = [];
  let diferido = 0;

  const ctx = gsap.context(() => {
    /**
     * El iris del cierre: la ventana se encoge (s) y el contenido crece (1/s), los dos alrededor del
     * mismo punto. El producto es 1: en pantalla el dibujo se queda quieto y nada se redibuja.
     */
    const { r0, r1 } = PUNTOS.iris;
    const cierre = { s: 1 };
    const pintaIris = () => {
      gsap.set(iris, { scale: cierre.s });
      gsap.set(irisContenido, { scale: 1 / cierre.s });
    };

    /* ── La cámara, atada al scroll ── */
    // Cada cambio de plano es un CORTE: en el mismo instante se apaga uno y se prende el otro. Fundidos,
    // los dos se veían encimados a media opacidad (un Moli gigante y gris detrás del celular, el texto
    // sobre su cara; recorrido del 7-oct, scripts/r1-recorrido.mjs). El primer plano llega un poco chico y
    // termina de crecer, como si la cámara siguiera empujando: sin fondo propio, sus orillas son la noche.
    const camara = gsap.timeline({ defaults: { ease: "none" } });
    const CORTE_IDA = 0.84;
    const CORTE_VUELTA = 3.9;
    camara
      .set({}, {}, PANTALLAS)
      // Empujón al celular: el plano general crece hacia él y, ya encima, corte al primer plano.
      .fromTo(lamina, { scale: 1 }, { scale: 2.3, ease: "power2.in", duration: 0.72 }, 0.18)
      // Solo opacidad, sin visibility: oculto, el plano tendría que volver a rasterizarse al regresar
      // (medido: un cuadro de ~40 ms justo al iniciar el regreso de la cámara).
      .set(general, { opacity: 0 }, CORTE_IDA)
      .set(cerca, { autoAlpha: 1 }, CORTE_IDA)
      .fromTo(cerca, { scale: 0.92 }, { scale: 1, ease: "power2.out", duration: 0.16, immediateRender: false }, CORTE_IDA)
      // De regreso al plano general: la noche sigue y Moli vuelve a su guardia.
      .set(cerca, { autoAlpha: 0 }, CORTE_VUELTA)
      .set(general, { opacity: 1 }, CORTE_VUELTA)
      .fromTo(lamina, { scale: 2.3 }, { scale: 1, ease: "power2.out", duration: 0.55, immediateRender: false }, CORTE_VUELTA);

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
      onUpdate: (self) => {
        irA(pausaEn(self.progress));
        amanecer(esDeDia(self));
      },
      onToggle: (self) => {
        activa = self.isActive;
        amanecer(esDeDia(self));
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

    /* ── La mano de Moli con su herramienta ── */
    // Medidas en el sistema del primer plano: la cámara lo escala (0.92 → 1) y eso se deshace aquí.
    const escalaCerca = () => Number(gsap.getProperty(cerca, "scale")) || 1;
    function enPantalla(el: Element) {
      const e = escenario.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - e.left, y: r.top - e.top, w: r.width, h: r.height, cx: r.left - e.left + r.width / 2, cy: r.top - e.top + r.height / 2 };
    }
    function aLocal(px: number, py: number) {
      const s = escalaCerca();
      const ox = escenario.clientWidth / 2;
      const oy = escenario.clientHeight / 2;
      return { x: ox + (px - ox) / s, y: oy + (py - oy) / s };
    }

    /** Dónde queda el centro del vidrio dentro de la mano, y la punta del lápiz: medidos con las manos quietas. */
    // En escritorio la etiqueta es más grande: con 1.3 «✗ 10:00 / pedida» cabe entera en la lente.
    const aumento = () => (escritorio.matches ? 1.3 : 1.4);
    let centroLente = { x: 0, y: 0 };
    let puntaLapiz = { x: 0, y: 0 };
    // Se miden la primera vez que hacen falta (P2 o P4), no al arrancar: así el arranque es más corto.
    let medidas = false;
    const asegura = () => {
      if (!medidas) mideManos();
    };
    function mideManos() {
      medidas = true;
      const s = escalaCerca();
      gsap.set([lupa, lapiz], { x: 0, y: 0, scale: 1, rotation: 0 });
      const m = enPantalla(lupa);
      const l = enPantalla(lente);
      centroLente = { x: (l.cx - m.x) / s, y: (l.cy - m.y) / s };
      gsap.set(vidrio, { left: centroLente.x - l.w / s / 2, top: centroLente.y - l.h / s / 2, width: l.w / s, height: l.h / s });
      const ml = enPantalla(lapiz);
      const p = enPantalla(punta);
      puntaLapiz = { x: (p.cx - ml.x) / s, y: (p.cy - ml.y) / s };
    }
    /** Dónde poner la mano para que el centro de la lente quede sobre un texto de la agenda. */
    function lupaSobre(objetivo: Element) {
      asegura();
      const r = enPantalla(objetivo);
      const p = aLocal(r.cx, r.cy);
      return { x: p.x - centroLente.x, y: p.y - centroLente.y };
    }
    /** Dónde poner la mano para que la punta del lápiz quede en un punto de la pantalla. */
    function lapizEn(px: number, py: number) {
      asegura();
      const p = aLocal(px, py);
      return { x: p.x - puntaLapiz.x, y: p.y - puntaLapiz.y };
    }
    /**
     * Lo que se ve dentro del vidrio: el punto de la agenda que está bajo el centro de la lente,
     * aumentado. Se deshace la matriz de la hoja (GSAP la mueve y está girada −1.2°) y el giro de la
     * mano, para que el mundo dentro de la lupa no gire con ella.
     */
    function actualizaVidrio() {
      const l = lente.getBoundingClientRect();
      const h = hoja.getBoundingClientRect();
      const estilo = getComputedStyle(hoja).transform;
      const m = new DOMMatrix(estilo === "none" ? undefined : estilo);
      const inv = m.inverse();
      const dx = l.left + l.width / 2 - (h.left + h.width / 2);
      const dy = l.top + l.height / 2 - (h.top + h.height / 2);
      const ux = inv.a * dx + inv.c * dy;
      const uy = inv.b * dx + inv.d * dy;
      const gx = hoja.offsetWidth / 2 + ux - hoja.clientLeft - rejilla.offsetLeft;
      const gy = hoja.offsetHeight / 2 + uy - hoja.clientTop - rejilla.offsetTop;
      const giro = (Math.atan2(m.b, m.a) * 180) / Math.PI - Number(gsap.getProperty(lupa, "rotation"));
      const d = vidrio.offsetWidth / 2;
      rejillaCopia.style.width = `${rejilla.offsetWidth}px`;
      rejillaCopia.style.height = `${rejilla.offsetHeight}px`;
      rejillaCopia.style.transform = `translate(${d}px, ${d}px) rotate(${giro}deg) scale(${aumento()}) translate(${-gx}px, ${-gy}px)`;
    }

    function estado(pausaDelDia: number) {
      actos.forEach((a) => a.estado(pausaDelDia));
      const k = Math.min(pausaDelDia, ULTIMA_NOCHE);
      const n = BURBUJAS[k];
      burbujas.forEach((b, i) => gsap.set(b, { autoAlpha: i < n ? 1 : 0, scale: 1, y: 0 }));
      gsap.set(chat, { y: desplazamiento(n) });
      gsap.set(hoja, hojaArriba(k) ? hojaDentro() : hojaFuera());
      gsap.set(equis, { strokeDashoffset: k >= 2 ? 0 : 40 });
      // Con la cita puesta, las 11:00 ya chocan con ella: lo libre se apaga.
      gsap.set(libres, { scale: 1, autoAlpha: k >= 4 ? 0 : 1 });
      gsap.set(citas, { clipPath: k >= 4 ? DESTAPADA : TAPADA });
      gsap.set(palomitas, { autoAlpha: k >= 4 ? 1 : 0, scale: 1 });
      // En P2 la lupa se queda sobre las 10:30, la primera hora libre que va a ofrecer.
      if (k === 2 && hojaArriba(2)) {
        gsap.set(lupa, { ...lupaSobre(libre1030), autoAlpha: 1, scale: 1, rotation: 0 });
        actualizaVidrio();
      } else gsap.set(lupa, { autoAlpha: 0 });
      gsap.set(lapiz, { autoAlpha: 0 });
      gsap.set(notaYo, { autoAlpha: k === 1 ? 1 : 0, clipPath: DESTAPADA });
      gsap.set(notaListo, { autoAlpha: k === 4 || k === 5 ? 1 : 0, clipPath: DESTAPADA });
      moliC.quieto(CARAS[k]);
      // El plano general: de ida, el mensaje espera; de vuelta (P6) ya se contestó y la luz se cierra.
      gsap.set([notif, notaQuien], { autoAlpha: k <= 1 ? 1 : 0 });
      gsap.set(luzGrande, { opacity: k === 6 ? 0 : 1 });
      cierre.s = 1;
      pintaIris();
      gsap.set(luzChica, { opacity: k === 6 ? 1 : 0 });
      moliG.quieto("dormita");
    }
    reponer = () => {
      medidas = false;
      actos.forEach((a) => a.reponer());
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
    /** La lupa se desliza a otra hora de la agenda; el vidrio se actualiza en cada cuadro. */
    function recorre(tl: gsap.core.Timeline, objetivo: Element, t: number) {
      tl.to(lupa, { x: () => lupaSobre(objetivo).x, y: () => lupaSobre(objetivo).y, duration: 0.5, ease: "power2.inOut", onUpdate: actualizaVidrio }, t);
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
      // P2: llega «mañana a las 10», sube la agenda y Moli la revisa con la lupa, hora por hora.
      2: (tl) => {
        tl.to(notaYo, { autoAlpha: 0, duration: 0.2 }, 0);
        llega(tl, 2, 0);
        tl.call(() => moliC.cara("concentra"), undefined, 0.2);
        subeHoja(tl, 0.35);
        // Sale del lado de Moli y se para sobre las 10:00 pedidas: ahí está ocupado.
        tl.set(lupa, { x: () => lupaSobre(pedida).x, y: () => lupaSobre(pedida).y, rotation: 0 }, 0.92);
        tl.fromTo(lupa, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.42, ease: "back.out(2)", immediateRender: false, onUpdate: actualizaVidrio }, 0.92);
        tl.to(lupa, { rotation: -5, duration: 0.13, yoyo: true, repeat: 3, ease: "sine.inOut", onUpdate: actualizaVidrio }, 1.32);
        tl.to(equis, { strokeDashoffset: 0, duration: 0.32, ease: "steps(4)" }, 1.42);
        // Luego baja a lo libre: las 10:30 y las 11:00 se encienden bajo el vidrio.
        recorre(tl, libre1030, 2.0);
        tl.to(libres, { scale: 1.06, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.4);
        recorre(tl, libre1100, 2.75);
        recorre(tl, libre1030, 3.4);
      },
      // P3: guarda la lupa, baja la agenda y ofrece lo libre.
      3: (tl) => {
        tl.to(lupa, { scale: 0.3, autoAlpha: 0, duration: 0.22, ease: "power2.in", onUpdate: actualizaVidrio }, 0);
        bajaHoja(tl, 0.1);
        moliC.habla(tl, 0.45, "guino");
        llega(tl, 3, 0.6);
      },
      // P4: llega el nombre, sube la agenda y Moli escribe la cita con su lápiz: el verde sale detrás
      // de la punta, de derecha a izquierda (desde su lado).
      4: (tl) => {
        llega(tl, 4, 0);
        tl.call(() => moliC.cara("concentra"), undefined, 0.15);
        if (!escritorio.matches) subeHoja(tl, 0.4);
        const trazo = { p: 0 };
        const escribeCita = () => {
          const r = enPantalla(citaHoja);
          const x = r.x + r.w - 6 - (r.w - 14) * trazo.p;
          const y = r.cy + Math.sin(trazo.p * Math.PI * 6) * 2.5;
          gsap.set(lapiz, lapizEn(x, y));
          gsap.set(citas, { clipPath: `inset(0% 0% 0% ${((1 - trazo.p) * 100).toFixed(2)}%)` });
        };
        tl.call(() => {
          trazo.p = 0;
          escribeCita();
        }, undefined, 0.95);
        tl.fromTo(lapiz, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, 0.95);
        moliC.ondear(tl, 1.15);
        tl.to(trazo, { p: 1, duration: 0.95, ease: "power1.inOut", onUpdate: escribeCita }, 1.25);
        tl.to(libres, { autoAlpha: 0, duration: 0.3, ease: "steps(3)" }, 1.7);
        // La palomita: un toquecito del lápiz.
        tl.to(lapiz, { y: "-=12", duration: 0.09, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.25);
        tl.fromTo(palomitas, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, 2.32);
        tl.to(lapiz, { autoAlpha: 0, scale: 0.4, duration: 0.25, ease: "power2.in" }, 2.65);
        tl.call(() => moliC.cara("feliz"), undefined, 2.45);
        moliC.salto(tl, 2.45);
        escribe(tl, notaListo, 2.75);
      },
      // P5: baja la agenda y le confirma a Mariana.
      5: (tl) => {
        bajaHoja(tl, 0);
        moliC.habla(tl, 0.35, "feliz");
        llega(tl, 5, 0.5);
      },
      // P6: termina la plática. Cuando la cámara ya regresó, Moli bosteza, la luz se cierra a su
      // alrededor como el iris de las caricaturas y él se acomoda para dormitar de guardia.
      6: (tl) => {
        tl.call(() => moliG.cara("bosteza"), undefined, 0.6)
          .to(moliG.el, { scaleY: 1.05, scaleX: 0.97, duration: 0.5, ease: "sine.out" }, 0.6)
          .to(cierre, { s: r1 / r0, duration: 1.3, ease: "power3.inOut", onUpdate: pintaIris }, 0.85)
          .call(() => moliG.cara("dormita"), undefined, 1.35)
          .to(moliG.el, { scaleY: 0.97, scaleX: 1.015, duration: 0.55, ease: "sine.inOut" }, 1.35)
          .to(moliG.el, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "sine.out" }, 1.9)
          // Al final, el círculo perfecto le pasa la estafeta a la luz chica, de borde dibujado a mano.
          // En orden y no cruzadas: dos capas a media opacidad dejan ver la noche y sale un disco gris.
          // La chica (encima) entra completa y hasta entonces se apaga la grande.
          .to(luzChica, { opacity: 1, duration: 0.45, ease: "sine.inOut" }, 1.85)
          .to(luzGrande, { opacity: 0, duration: 0.3, ease: "sine.out" }, 2.3);
      },
      // P7 a P17 (las 09:00, las 11:20, las 16:05 y las 19:00) los agregan los actos de día.
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

    // Los actos de día, cada uno en su propia tarea. Armado junto con la noche, el de la mañana llevaba
    // la tarea a más de 70 ms con la CPU 4× más lenta (scripts/medir-carga.mjs); separados, ninguna llega
    // a ser larga.
    const armaDesde = (i: number) => {
      diferido = window.setTimeout(() =>
        ctx.add(() => {
          const { nombre, armar } = ARMADORES[i];
          performance.mark(`historia:${nombre}`);
          const acto: Acto = armar(raiz, { escenario, escritorio });
          acto.camara(camara);
          Object.assign(ENTRADAS, acto.entradas);
          actos.push(acto);
          // Si la página abrió a media escena, la cámara se vuelve a pintar con lo que se le agregó.
          const t = camara.time();
          if (t > 0) camara.time(0).time(t);
          acto.estado(pausa);
          performance.measure(`historia:${nombre}`, `historia:${nombre}`);
          if (i + 1 < ARMADORES.length) armaDesde(i + 1);
        }),
      );
    };
    armaDesde(0);
  }, raiz);

  /* ── Línea viva: el trazo de Moli tiembla a 12 cuadros por segundo, solo el que está a cuadro ── */
  let cuadro = 0;
  const semillas = [3, 11, 23];
  const linea = window.setInterval(() => {
    if (!activa || document.hidden) return;
    cuadro = (cuadro + 1) % 3;
    let visible: ReturnType<typeof crearMoli> | null | undefined;
    for (let i = actos.length - 1; i >= 0 && visible === undefined; i--) visible = actos[i].moliEn(pausa);
    if (visible === undefined) visible = pausa >= 1 && pausa <= 5 ? moliC : moliG;
    visible?.ruido.setAttribute("seed", String(semillas[cuadro]));
  }, 1000 / 12);

  // Al cruzar el corte de escritorio la hoja cambia de lugar: se recalcula el reposo.
  const alCambiarTamano = () => {
    actuacion?.progress(1).kill();
    actuacion = null;
    ScrollTrigger.refresh();
    reponer();
  };
  escritorio.addEventListener("change", alCambiarTamano);
  // En escritorio los primeros planos miden en --u (tokens.css), que crece con la ventana: si cambió, lo
  // que se midió de las manos con el tamaño anterior quedaría chueco y se vuelve a medir.
  const unidad = () => (escritorio.matches ? Math.max(1, Math.min(innerWidth / 1280, innerHeight / 800)) : 1);
  let u = unidad();
  const alRefrescar = () => {
    const nueva = unidad();
    if (Math.abs(nueva - u) < 0.001) return;
    u = nueva;
    actuacion?.progress(1).kill();
    actuacion = null;
    reponer();
  };
  ScrollTrigger.addEventListener("refresh", alRefrescar);

  return () => {
    copia.replaceChildren();
    window.clearInterval(linea);
    window.clearTimeout(diferido);
    escritorio.removeEventListener("change", alCambiarTamano);
    ScrollTrigger.removeEventListener("refresh", alRefrescar);
    actuacion?.kill();
    ctx.revert();
    amanecer(false);
  };
}
