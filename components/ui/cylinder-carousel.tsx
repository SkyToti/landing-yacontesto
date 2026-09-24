"use client";

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { registrarTambor } from "@/lib/tambor";

/**
 * Cylinder Carousel de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su geometría: N cartas repartidas en 1turn/N, cada una rotada en Y y empujada
 * `(w/2 + separación) / tan(ángulo/2)` con `tan()` de CSS, perspectiva en el contenedor y la
 * máscara que desvanece los lados. Así el cilindro se ve completo desde el HTML, sin esperar JS.
 * Cambios:
 * - Cartas de cualquier contenido (aquí, notificaciones), no solo imágenes, y el cilindro por
 *   fuera (convexo): la carta del frente es la más cercana.
 * - El giro no es una animación CSS: es física. Deriva sola, se arrastra con inercia y se asienta
 *   con un resorte críticamente amortiguado en la carta más cercana. Con teclado: flechas, Inicio
 *   y Fin, y una región viva que dice qué mensaje quedó al frente.
 * - Luz y profundidad según el ángulo: cada carta se oscurece y se desenfoca conforme se aleja
 *   del frente, y atrapa un reflejo al pasar por él.
 * - El Director (GSAP) puede guiarlo con el scroll (`lib/tambor.ts`).
 * - Se detiene fuera de pantalla y, con movimiento reducido, no deriva solo.
 */

const RESORTE = 11; // rad/s: qué tan firme se asienta en una carta
const INERCIA = 0.32; // s: cuánto proyecta la velocidad al soltar
const TOPE = 100; // grados: más allá del frente, la carta no se dibuja
const REANUDAR_MS = 3200;

type Luz = { opacidad: number; luz: number; desenfoque: number; brillo: number };

function normal(angulo: number) {
  return ((((angulo + 180) % 360) + 360) % 360) - 180;
}

function luzDe(rel: number): Luz {
  const ab = Math.abs(rel);
  const cara = Math.cos((rel * Math.PI) / 180);
  const alejamiento = Math.max(0, 1 - cara);
  return {
    opacidad: ab >= TOPE ? 0 : ab <= 58 ? 1 : 1 - (ab - 58) / (TOPE - 58),
    luz: Math.min(0.62, alejamiento * 0.75),
    desenfoque: Math.min(5, alejamiento * 6),
    // El reflejo: la luz viene de arriba a la izquierda; cada carta la atrapa al pasar el frente.
    brillo: Math.exp(-(((rel + 14) / 22) ** 2)),
  };
}

function estiloDe(l: Luz): CSSProperties {
  return {
    opacity: Number(l.opacidad.toFixed(3)),
    visibility: l.opacidad <= 0.001 ? "hidden" : "visible",
    ["--luz" as string]: l.luz.toFixed(3),
    ["--desenfoque" as string]: `${l.desenfoque.toFixed(2)}px`,
    ["--brillo" as string]: l.brillo.toFixed(3),
  };
}

export interface CylinderCarouselProps {
  id: string;
  /** Nombre de la región para lectores de pantalla. */
  etiqueta: string;
  /** Lo que la región viva dice de cada carta cuando queda al frente con el teclado. */
  anuncios: string[];
  /** Una carta por hijo (se pintan en el servidor). */
  children: ReactNode;
  /** Lista accesible de lo que hay en las cartas (el cilindro en sí es decorativo). */
  lista?: ReactNode;
  /** Grados por segundo; negativo gira hacia la izquierda. */
  autoVelocidad?: number;
  interactivo?: boolean;
  className?: string;
}

export function CylinderCarousel({
  id,
  etiqueta,
  anuncios,
  children,
  lista,
  autoVelocidad = -7,
  interactivo = true,
  className,
}: CylinderCarouselProps) {
  const cartas = Children.toArray(children);
  const n = cartas.length;
  const paso = 360 / n;
  const raiz = useRef<HTMLDivElement>(null);
  const giro = useRef<HTMLDivElement>(null);
  const agarre = useRef<HTMLDivElement>(null);
  const vivo = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = giro.current;
    const contenedor = raiz.current;
    if (!el || !contenedor) return;
    const nodos = Array.from(el.children) as HTMLElement[];
    const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const s = {
      angulo: 0,
      vel: 0,
      modo: (reducido ? "reposo" : "auto") as "auto" | "arrastre" | "resorte" | "reposo",
      objetivo: 0,
      factorAuto: reducido ? 0 : 1,
      pausa: false,
      guia: 0,
      guiaIndice: 0,
      otras: 1,
      frente: 1,
      visible: true,
      xPrevio: 0,
      muestras: [] as Array<{ t: number; a: number }>,
    };
    const cache = nodos.map(() => ({ opacidad: -1, luz: -1, desenfoque: -1, brillo: -9, frente: false }));
    let raf = 0;
    let antes = 0;
    let temporizador = 0;

    const frenteDe = (angulo: number) => ((Math.round(-angulo / paso) % n) + n) % n;
    const anguloFinal = () => {
      if (s.guia <= 0) return s.angulo;
      const destino = s.angulo + normal(-s.guiaIndice * paso - s.angulo);
      return s.angulo + (destino - s.angulo) * Math.min(1, s.guia);
    };

    function pintar() {
      const angulo = anguloFinal();
      el!.style.setProperty("--angulo", `${angulo.toFixed(3)}deg`);
      const f = frenteDe(angulo);
      for (let i = 0; i < n; i++) {
        const rel = normal(i * paso + angulo);
        const l = luzDe(rel);
        const opacidad = l.opacidad * (i === f ? s.frente : s.otras);
        const c = cache[i];
        const nodo = nodos[i];
        if (Math.abs(c.opacidad - opacidad) > 0.004) {
          nodo.style.opacity = opacidad.toFixed(3);
          nodo.style.visibility = opacidad <= 0.001 ? "hidden" : "visible";
          c.opacidad = opacidad;
        }
        if (Math.abs(c.luz - l.luz) > 0.004) {
          nodo.style.setProperty("--luz", l.luz.toFixed(3));
          c.luz = l.luz;
        }
        if (Math.abs(c.desenfoque - l.desenfoque) > 0.05) {
          nodo.style.setProperty("--desenfoque", `${l.desenfoque.toFixed(2)}px`);
          c.desenfoque = l.desenfoque;
        }
        if (Math.abs(c.brillo - l.brillo) > 0.008) {
          nodo.style.setProperty("--brillo", l.brillo.toFixed(3));
          c.brillo = l.brillo;
        }
        const alFrente = i === f && Math.abs(rel) < paso / 2;
        if (c.frente !== alFrente) {
          nodo.toggleAttribute("data-frente", alFrente);
          c.frente = alFrente;
        }
      }
    }

    function cuadro(ahora: number) {
      raf = 0;
      const dt = Math.min(0.05, antes ? (ahora - antes) / 1000 : 1 / 60);
      antes = ahora;
      let otro = false;

      if (s.guia > 0) {
        // El scroll manda: no deriva.
      } else if (s.modo === "auto") {
        const meta = s.pausa ? 0 : 1;
        s.factorAuto += (meta - s.factorAuto) * Math.min(1, dt * 2.5);
        s.angulo += autoVelocidad * s.factorAuto * dt;
        if (s.pausa && s.factorAuto < 0.05) {
          s.objetivo = Math.round(s.angulo / paso) * paso;
          s.vel = autoVelocidad * s.factorAuto;
          s.modo = "resorte";
        }
        otro = true;
      } else if (s.modo === "resorte") {
        // Resorte críticamente amortiguado, en subpasos para que no se dispare con cuadros largos.
        let resto = dt;
        while (resto > 0) {
          const h = Math.min(resto, 1 / 120);
          const x = s.angulo - s.objetivo;
          s.vel += (-RESORTE * RESORTE * x - 2 * RESORTE * s.vel) * h;
          s.angulo += s.vel * h;
          resto -= h;
        }
        if (Math.abs(s.angulo - s.objetivo) < 0.02 && Math.abs(s.vel) < 0.5) {
          s.angulo = s.objetivo;
          s.vel = 0;
          s.modo = "reposo";
          programarReanudar();
        } else {
          otro = true;
        }
      }

      pintar();
      if (otro && s.visible) solicitar();
      else antes = 0;
    }

    function solicitar() {
      if (!raf) raf = requestAnimationFrame(cuadro);
    }

    function programarReanudar() {
      window.clearTimeout(temporizador);
      if (reducido) return;
      temporizador = window.setTimeout(() => {
        if (s.pausa || s.modo !== "reposo" || s.guia > 0) return;
        s.factorAuto = 0;
        s.modo = "auto";
        solicitar();
      }, REANUDAR_MS);
    }

    function irA(objetivo: number, anunciar: boolean) {
      s.objetivo = objetivo;
      s.modo = reducido ? "reposo" : "resorte";
      if (reducido) s.angulo = objetivo;
      if (anunciar && vivo.current) vivo.current.textContent = anuncios[frenteDe(objetivo)] ?? "";
      solicitar();
      if (reducido) programarReanudar();
    }

    // Arrastre con inercia y teclado, sobre la región que cubre el cilindro.
    const zona = agarre.current;
    const alPresionar = (e: globalThis.PointerEvent) => {
      if (e.button !== 0 || s.guia > 0) return;
      zona?.setPointerCapture(e.pointerId);
      window.clearTimeout(temporizador);
      s.modo = "arrastre";
      s.vel = 0;
      s.xPrevio = e.clientX;
      s.muestras = [{ t: e.timeStamp, a: s.angulo }];
      zona?.setAttribute("data-arrastrando", "");
    };
    const alMover = (e: globalThis.PointerEvent) => {
      if (s.modo !== "arrastre") return;
      const ancho = nodos[0]?.offsetWidth || 240;
      const dx = e.clientX - s.xPrevio;
      s.xPrevio = e.clientX;
      s.angulo += dx * (paso / ancho);
      s.muestras.push({ t: e.timeStamp, a: s.angulo });
      if (s.muestras.length > 8) s.muestras.shift();
      solicitar();
    };
    const alSoltar = (e: globalThis.PointerEvent, conInercia: boolean) => {
      if (s.modo !== "arrastre") return;
      zona?.removeAttribute("data-arrastrando");
      if (zona?.hasPointerCapture(e.pointerId)) zona.releasePointerCapture(e.pointerId);
      const recientes = s.muestras.filter((m) => e.timeStamp - m.t < 110);
      let vel = 0;
      if (conInercia && recientes.length > 1) {
        const a = recientes[0];
        const b = recientes[recientes.length - 1];
        vel = b.t > a.t ? ((b.a - a.a) / (b.t - a.t)) * 1000 : 0;
      }
      s.vel = Math.max(-900, Math.min(900, vel));
      irA(Math.round((s.angulo + s.vel * INERCIA) / paso) * paso, false);
    };
    const alSoltarNormal = (e: globalThis.PointerEvent) => alSoltar(e, true);
    const alCancelar = (e: globalThis.PointerEvent) => alSoltar(e, false);
    const alEntrar = () => {
      s.pausa = true;
      window.clearTimeout(temporizador);
      if (s.modo === "reposo") return;
      solicitar();
    };
    const alSalir = () => {
      if (zona && document.activeElement === zona) return;
      s.pausa = false;
      if (s.modo === "reposo") programarReanudar();
    };
    zona?.addEventListener("pointerdown", alPresionar);
    zona?.addEventListener("pointermove", alMover);
    zona?.addEventListener("pointerup", alSoltarNormal);
    zona?.addEventListener("pointercancel", alCancelar);
    zona?.addEventListener("pointerenter", alEntrar);
    zona?.addEventListener("pointerleave", alSalir);
    zona?.addEventListener("focus", alEntrar);
    zona?.addEventListener("blur", alSalir);

    const teclado = (e: globalThis.KeyboardEvent) => {
      if (s.guia > 0) return;
      const base = s.modo === "resorte" ? s.objetivo : Math.round(s.angulo / paso) * paso;
      const f = frenteDe(base);
      const hacia = (indice: number) => base + normal(-indice * paso - base);
      let destino: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") destino = base - paso;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") destino = base + paso;
      else if (e.key === "Home") destino = hacia(0);
      else if (e.key === "End") destino = hacia(n - 1);
      if (destino === null) return;
      e.preventDefault();
      if (f === frenteDe(destino) && e.key !== "Home" && e.key !== "End") return;
      irA(destino, true);
    };
    zona?.addEventListener("keydown", teclado);

    // Fuera de pantalla no se gasta ni un cuadro.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        s.visible = entrada.isIntersecting;
        if (s.visible) solicitar();
      },
      { rootMargin: "80px" },
    );
    observador.observe(contenedor);

    const quitar = registrarTambor(id, {
      guiar(factor, indice) {
        const previa = s.guia;
        s.guia = Math.max(0, Math.min(1, factor));
        s.guiaIndice = indice;
        if (s.guia > 0 && previa === 0) {
          window.clearTimeout(temporizador);
          if (s.modo === "arrastre") s.modo = "reposo";
        }
        if (s.guia === 0 && previa > 0) {
          // Al volver a la portada, el cilindro retoma su deriva desde donde quedó.
          s.angulo = anguloFinal();
          s.modo = reducido ? "reposo" : "auto";
          s.factorAuto = 0;
        }
        solicitar();
      },
      atenuar(otras, frente) {
        s.otras = otras;
        s.frente = frente;
        solicitar();
      },
      carta: (indice) => nodos[indice] ?? null,
    });

    solicitar();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(temporizador);
      observador.disconnect();
      quitar();
      zona?.removeEventListener("pointerdown", alPresionar);
      zona?.removeEventListener("pointermove", alMover);
      zona?.removeEventListener("pointerup", alSoltarNormal);
      zona?.removeEventListener("pointercancel", alCancelar);
      zona?.removeEventListener("pointerenter", alEntrar);
      zona?.removeEventListener("pointerleave", alSalir);
      zona?.removeEventListener("focus", alEntrar);
      zona?.removeEventListener("blur", alSalir);
      zona?.removeEventListener("keydown", teclado);
    };
  }, [id, n, paso, autoVelocidad, anuncios]);

  return (
    <div ref={raiz} className={cn("tambor", className)} data-tambor={id}>
      <div className="tambor-escena" aria-hidden="true">
        <div ref={giro} className="tambor-giro" style={{ ["--n" as string]: n } as CSSProperties}>
          {cartas.map((carta, i) => (
            <div key={i} className="tambor-carta" style={{ ["--i" as string]: i, ...estiloDe(luzDe(normal(i * paso))) } as CSSProperties}>
              {carta}
            </div>
          ))}
        </div>
      </div>
      {interactivo && (
        <div
          ref={agarre}
          className="tambor-agarre"
          role="region"
          aria-roledescription="carrusel"
          aria-label={etiqueta}
          tabIndex={0}
        >
          {lista}
          <p ref={vivo} className="solo-lectores" aria-live="polite" />
        </div>
      )}
    </div>
  );
}

export default CylinderCarousel;
