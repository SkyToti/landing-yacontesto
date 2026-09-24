"use client";

import * as React from "react";
import { m, type Transition } from "motion/react";
import { MotionPerezoso } from "./motion-perezoso";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Perspective Carousel de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su movimiento: la tira se corre con un resorte hasta centrar la activa, y cada
 * diapositiva gira en Y según su distancia (`rotationStep`) y se achica si no está activa.
 * Cambios: diapositivas de cualquier contenido (aquí, los días de la agenda) en lugar de
 * imágenes; un modo `decorativo` para cuando vive dentro de una ilustración (sin foco, sin
 * controles, oculto a lectores de pantalla); `motion/react` en lugar de framer-motion, y
 * MotionConfig con `reducedMotion="user"`.
 */

export interface PerspectiveCarouselItem {
  clave: string;
  titulo: string;
  contenido: React.ReactNode;
}

export interface PerspectiveCarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: PerspectiveCarouselItem[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  loop?: boolean;
  slideWidth?: number;
  rotationStep?: number;
  inactiveScale?: number;
  transition?: Transition;
  showControls?: boolean;
  decorativo?: boolean;
  etiqueta?: string;
  slideClassName?: string;
}

const DEFAULT_TRANSITION: Transition = { type: "spring", bounce: 0.14, duration: 0.9 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function PerspectiveCarousel({
  items,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  loop = false,
  slideWidth = 200,
  rotationStep = 60,
  inactiveScale = 0.85,
  transition = DEFAULT_TRANSITION,
  showControls = true,
  decorativo = false,
  etiqueta = "Carrusel",
  slideClassName,
  className,
  ...props
}: PerspectiveCarouselProps) {
  const maxIndex = Math.max(0, items.length - 1);
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(() => clamp(defaultActiveIndex, 0, maxIndex));
  const currentIndex = clamp(activeIndex ?? uncontrolledIndex, 0, maxIndex);
  const safeSlideWidth = Math.max(40, slideWidth);
  const safeInactiveScale = clamp(inactiveScale, 0.5, 1);

  const selectSlide = (nextIndex: number) => {
    if (!items.length) return;
    const resolved = loop ? (nextIndex + items.length) % items.length : clamp(nextIndex, 0, maxIndex);
    if (activeIndex === undefined) setUncontrolledIndex(resolved);
    onActiveIndexChange?.(resolved);
  };

  if (!items.length) return null;

  const accesible = decorativo
    ? { "aria-hidden": true as const }
    : {
        role: "region",
        "aria-roledescription": "carrusel",
        "aria-label": etiqueta,
        tabIndex: 0,
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            selectSlide(currentIndex - 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            selectSlide(currentIndex + 1);
          }
        },
      };

  return (
    <MotionPerezoso>
      <div className={cn("perspectiva", className)} {...accesible} {...props}>
        <div className="perspectiva-ventana" style={{ perspective: "1200px" }}>
          <m.div
            className="perspectiva-tira"
            initial={false}
            animate={{ x: -(currentIndex * safeSlideWidth + safeSlideWidth / 2) }}
            transition={transition}
          >
            {items.map((item, index) => {
              const isActive = currentIndex === index;
              return (
                <div key={item.clave} className="perspectiva-hueco" style={{ width: safeSlideWidth, perspective: "1200px" }}>
                  <m.div
                    className={cn("perspectiva-diapositiva", slideClassName)}
                    data-activa={isActive ? "" : undefined}
                    initial={false}
                    animate={{ rotateY: (currentIndex - index) * rotationStep, scale: isActive ? 1 : safeInactiveScale }}
                    transition={transition}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {item.contenido}
                  </m.div>
                </div>
              );
            })}
          </m.div>
        </div>

        {showControls && !decorativo && (
          <div className="perspectiva-controles">
            <button type="button" aria-label="Anterior" disabled={!loop && currentIndex === 0} onClick={() => selectSlide(currentIndex - 1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" aria-label="Siguiente" disabled={!loop && currentIndex === maxIndex} onClick={() => selectSlide(currentIndex + 1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </MotionPerezoso>
  );
}

export default PerspectiveCarousel;
