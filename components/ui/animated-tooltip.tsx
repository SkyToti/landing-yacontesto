"use client";

import * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m, type Variants } from "motion/react";
import { MotionPerezoso } from "./motion-perezoso";
import { cn } from "@/lib/utils";

/**
 * Animated Tooltip de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conservan sus formas en SVG y sus animaciones de entrada y salida con resorte.
 * Cambios: el disparador es un botón de verdad (aria-expanded) que se abre al tocarlo, además
 * de al pasar el cursor o enfocarlo, y se cierra con Escape; tamaño del globo y ancho del texto
 * configurables (para un párrafo corto, no solo una palabra); colores con los tokens de la
 * marca; motion/react en lugar de framer-motion y MotionConfig con reducedMotion="user".
 */

export type AnimatedTooltipVariant =
  | "cora"
  | "smaug"
  | "dori"
  | "gram"
  | "indis"
  | "malva"
  | "sadoc";

interface VariantConfig {
  /** Bubble size in px. */
  width: number;
  height: number;
  /** Distance of the bubble above the trigger (CSS `bottom`). */
  bottom: string;
  /** transform-origin for the entrance animation. */
  transformOrigin: string;
  /** SVG path(s) rendered inside a `0 0 400 300` viewBox. */
  shape: (fill: string) => React.ReactNode;
  /** Bubble (base) entrance/exit animation, transitions embedded per state. */
  base: Variants;
  /** Inner content entrance/exit animation, transitions embedded per state. */
  content: Variants;
  /** Extra styles for the content wrapper. */
  contentStyle?: React.CSSProperties;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN: [number, number, number, number] = [0.55, 0, 1, 0.45];

const VARIANTS: Record<AnimatedTooltipVariant, VariantConfig> = {
  // Blobby heart — scales up while un-rotating.
  cora: {
    width: 232,
    height: 174,
    bottom: "calc(100% + 0.5rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 199,21.9 C 152,22.2 109,35.7 78.8,57.4 48,79.1 29,109 29,142 29,172 45.9,201 73.6,222 101,243 140,258 183,260 189,270 200,282 200,282 200,282 211,270 217,260 261,258 299,243 327,222 354,201 371,172 371,142 371,109 352,78.7 321,57 290,35.3 247,21.9 199,21.9 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { scale: 0, rotate: -180, opacity: 0 },
      animate: { scale: 1, rotate: 0, opacity: 1, transition: { duration: 0.6, ease: EASE_OUT_QUINT } },
      exit: { scale: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.25, ease: EASE_OUT_QUINT } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "0.75em" },
  },

  // Rounded pill with a downward pointer — tips in with a slide.
  smaug: {
    width: 240,
    height: 180,
    bottom: "calc(100% - 0.25rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 314,100 C 313,100 312,100 311,100 L 89.5,100 C 55.9,100 29.1,121 29.1,150 29.1,178 53.1,201 89.5,201 L 184,201 200,223 217,201 311,201 C 344,201 371,178 371,150 371,122 346,99 314,100 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { rotate: 35, opacity: 0 },
      animate: { rotate: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
      exit: { rotate: -35, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { x: 50, rotate: 6, opacity: 0 },
      animate: { x: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 12, delay: 0.05 } },
      exit: { x: -30, rotate: -6, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
  },

  // Banner ribbon with a pointer — drops in with elastic bounce.
  dori: {
    width: 240,
    height: 180,
    bottom: "calc(100% - 0.25rem)",
    transformOrigin: "50% 0%",
    shape: (fill) => (
      <path
        d="M 22,108 22,236 C 22,236 64,216 103,212 142,208 184,212 184,212 L 200,229 216,212 C 216,212 258,207 297,212 336,217 378,236 378,236 L 378,108 C 378,108 318,83.7 200,83.7 82,83.7 22,108 22,108 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { y: -60, scale: 0.5, opacity: 0 },
      animate: { y: 0, scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.5, duration: 0.8 } },
      exit: { y: -60, scale: 0.5, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.1, ease: EASE_OUT_QUINT } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "0.75em" },
  },

  // Wavy blob — squashes horizontally on entry.
  gram: {
    width: 240,
    height: 180,
    bottom: "calc(100% - 0.25rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 92.4,79 C 136,79 154,115 200,116 246,117 263,80.4 308,79 353,77.6 381,111 381,150 381,189 346,220 308,221 270,222 236,188 200,188 164,188 130,222 92.4,221 54.4,220 19,189 19,150 19,111 48.6,79 92.4,79 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { scaleX: 1.2, opacity: 0 },
      animate: { scaleX: 1, opacity: 1, transition: { duration: 0.4, ease: EASE_OUT_QUINT } },
      exit: { scaleX: 1.1, scaleY: 0.9, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.1, ease: EASE_OUT_QUINT } },
      exit: { scale: 0.8, opacity: 0, transition: { duration: 0.15, ease: EASE_IN } },
    },
  },

  // Rounded rectangle — rises from below with a spring.
  indis: {
    width: 240,
    height: 180,
    bottom: "calc(100% + 0.25rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 44.5,24 C 148,24 252,24 356,24 367,24 376,32.9 376,44 L 376,256 C 376,267 367,276 356,276 252,276 148,276 44.5,276 33.4,276 24.5,267 24.5,256 L 24.5,44 C 24.5,32.9 33.4,24 44.5,24 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { y: 100, scaleX: 0.3, scaleY: 1.3, opacity: 0 },
      animate: { y: 0, scaleX: 1, scaleY: 1, opacity: 1, transition: { type: "spring", bounce: 0.45, duration: 0.9 } },
      exit: { y: 100, scaleX: 0, scaleY: 1.5, opacity: 0, transition: { duration: 0.25, ease: EASE_IN } },
    },
    content: {
      initial: { y: 10, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.08, ease: "easeOut" } },
      exit: { y: -20, opacity: 0, transition: { duration: 0.15, ease: EASE_IN } },
    },
  },

  // Spiky starburst — pops in with a jiggle.
  malva: {
    width: 220,
    height: 165,
    bottom: "calc(100% + 0.25rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 94.9,90.2 101,30.7 163,72.3 229,17.7 263,68.2 319,55.9 315,102 375,144 316,175 340,228 265,220 251,263 180,233 143,282 98.9,218 57.5,236 82,189 25,170 82.8,141 48.7,93.7 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { scale: 0, rotate: -20, opacity: 0 },
      animate: { scale: [0, 1.15, 1], rotate: [-20, 6, 0], opacity: 1, transition: { duration: 0.7, ease: EASE_OUT_QUINT, times: [0, 0.6, 1] } },
      exit: { scale: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_IN } },
    },
    content: {
      initial: { scale: 0.7, opacity: 0 },
      animate: { scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.25, ease: EASE_OUT_QUINT } },
      exit: { scale: 0.7, opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
    },
    contentStyle: { width: "55%" },
  },

  // Outlined speech bubble — springs up from the trigger.
  sadoc: {
    width: 240,
    height: 180,
    bottom: "calc(100% + 0.5rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 32.1,42.7 54.5,257 185,257 193,269 200,282 207,269 214,257 342,257 368,23.9 Z"
        fill={fill}
        stroke="var(--muted-foreground)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    ),
    base: {
      initial: { y: -40, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.5, duration: 0.8 } },
      exit: { y: -40, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8, delay: 0.2 } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.15, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "1.25em" },
  },
};

export interface AnimatedTooltipProps {
  /** El texto del disparador (una palabra o frase corta). */
  children: React.ReactNode;
  /** Lo que aparece en el globo. */
  content: React.ReactNode;
  /** Forma y animación. */
  variant?: AnimatedTooltipVariant;
  /** Tamaño del globo en px (por defecto, el de la variante). */
  ancho?: number;
  alto?: number;
  /** Ancho del texto dentro del globo. */
  anchoContenido?: string;
  /** Color del disparador mientras el globo está abierto. */
  accentColor?: string;
  shapeColor?: string;
  textColor?: string;
  icono?: React.ReactNode;
  className?: string;
}

export function AnimatedTooltip({
  children,
  content,
  variant = "indis",
  ancho,
  alto,
  anchoContenido = "78%",
  accentColor = "var(--marca)",
  shapeColor = "var(--tinta-dia)",
  textColor = "var(--tinta-noche)",
  icono,
  className,
}: AnimatedTooltipProps) {
  const [open, setOpen] = useState(false);
  const fijo = useRef(false);
  const focoEn = useRef(-Infinity);
  const raiz = useRef<HTMLSpanElement>(null);
  const cfg = VARIANTS[variant] ?? VARIANTS.indis;
  const id = useId().replace(/:/g, "");
  const width = ancho ?? cfg.width;
  const height = alto ?? cfg.height;

  useEffect(() => {
    if (!open) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        fijo.current = false;
        setOpen(false);
      }
    };
    const alTocarFuera = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) {
        fijo.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alTocarFuera);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alTocarFuera);
    };
  }, [open]);

  return (
    <MotionPerezoso>
      <span
        ref={raiz}
        className={cn("globo-ayuda", className)}
        onMouseEnter={() => {
          if (matchMedia("(hover: hover)").matches) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!fijo.current) setOpen(false);
        }}
      >
        <m.button
          type="button"
          className="globo-ayuda-disparador"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => {
            // Un toque enfoca y hace clic casi a la vez: si el foco acaba de abrirlo, el clic lo
            // fija en vez de cerrarlo (antes el globo abría hasta el segundo toque).
            if (performance.now() - focoEn.current < 400) {
              fijo.current = true;
              setOpen(true);
              return;
            }
            fijo.current = !open;
            setOpen(!open);
          }}
          onFocus={() => {
            focoEn.current = performance.now();
            setOpen(true);
          }}
          onBlur={() => {
            if (!fijo.current) setOpen(false);
          }}
          animate={{ color: open ? accentColor : "var(--tinta-suave)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {icono}
          {children}
        </m.button>

        {/* El ancla fija centra el globo sobre el disparador; el interior solo anima la entrada. */}
        <span
          style={{
            position: "absolute",
            bottom: cfg.bottom,
            left: "50%",
            width,
            height,
            marginLeft: -width / 2,
            // Abierto, el globo es parte del contenedor: pasar el puntero encima no lo cierra.
            pointerEvents: open ? "auto" : "none",
            zIndex: 50,
          }}
        >
          <AnimatePresence>
            {open && (
              <m.span
                key="base"
                id={id}
                role="note"
                variants={cfg.base}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transformOrigin: cfg.transformOrigin,
                }}
              >
                <svg
                  viewBox="0 0 400 300"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  aria-hidden="true"
                >
                  {cfg.shape(shapeColor)}
                </svg>
                <m.span
                  variants={cfg.content}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    position: "relative",
                    width: anchoContenido,
                    textAlign: "left",
                    fontSize: "15px",
                    lineHeight: 1.42,
                    color: textColor,
                    ...cfg.contentStyle,
                  }}
                >
                  {content}
                </m.span>
              </m.span>
            )}
          </AnimatePresence>
        </span>
      </span>
    </MotionPerezoso>
  );
}

export default AnimatedTooltip;

