"use client";

import * as React from "react";
import { motion, MotionConfig, type Transition } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Diagonal Carousel de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su movimiento: la tira se corre con un resorte y cada tarjeta baja
 * (`verticalStep`), gira (`rotationStep`) y se achica según su distancia a la activa, con el
 * mismo control de flechas y puntos. Cambios: tarjetas de cualquier contenido en lugar de
 * imágenes (la activa recibe `data-activa`, y así su mini demostración arranca); las tarjetas
 * lejanas se desvanecen; textos en español; `motion/react` en lugar de framer-motion, y
 * MotionConfig con `reducedMotion="user"`.
 */

export interface DiagonalCarouselItem {
  clave: string;
  titulo: string;
  contenido: React.ReactNode;
}

export interface DiagonalCarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: DiagonalCarouselItem[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  slideSize?: number;
  rotationStep?: number;
  verticalStep?: number;
  inactiveScale?: number;
  transition?: Transition;
  showControls?: boolean;
  etiqueta?: string;
  slideClassName?: string;
}

const DEFAULT_TRANSITION: Transition = { type: "spring", bounce: 0.16, duration: 0.85 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function DiagonalCarousel({
  items,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  slideSize = 260,
  rotationStep = 12,
  verticalStep = 110,
  inactiveScale = 0.72,
  transition = DEFAULT_TRANSITION,
  showControls = true,
  etiqueta = "Carrusel",
  slideClassName,
  className,
  ...props
}: DiagonalCarouselProps) {
  const maxIndex = Math.max(0, items.length - 1);
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(() => clamp(defaultActiveIndex, 0, maxIndex));
  const currentIndex = clamp(activeIndex ?? uncontrolledIndex, 0, maxIndex);
  const safeSlideSize = Math.max(120, slideSize);
  const safeInactiveScale = clamp(inactiveScale, 0.35, 1);

  const selectSlide = (nextIndex: number) => {
    if (!items.length) return;
    const resolved = clamp(nextIndex, 0, maxIndex);
    if (activeIndex === undefined) setUncontrolledIndex(resolved);
    onActiveIndexChange?.(resolved);
  };

  if (!items.length) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label={etiqueta}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            selectSlide(currentIndex - 1);
          }
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            selectSlide(currentIndex + 1);
          }
        }}
        className={cn("diagonal", className)}
        {...props}
      >
        <div className="diagonal-ventana">
          <motion.div
            className="diagonal-tira"
            initial={false}
            animate={{ x: -(currentIndex * safeSlideSize + safeSlideSize / 2) }}
            transition={transition}
          >
            {items.map((item, index) => {
              const isActive = currentIndex === index;
              const distance = index - currentIndex;
              return (
                <motion.div
                  key={item.clave}
                  className={cn("diagonal-diapositiva", slideClassName)}
                  style={{ width: safeSlideSize }}
                  data-activa={isActive ? "" : undefined}
                  aria-hidden={isActive ? undefined : true}
                  initial={false}
                  animate={{
                    rotate: distance * rotationStep,
                    scale: isActive ? 1 : safeInactiveScale,
                    y: distance * verticalStep,
                    opacity: Math.max(0, 1 - Math.abs(distance) * 0.38),
                  }}
                  transition={transition}
                  onClick={() => !isActive && selectSlide(index)}
                >
                  {item.contenido}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {showControls && (
          <div className="diagonal-controles">
            <button type="button" aria-label="Anterior" disabled={currentIndex === 0} onClick={() => selectSlide(currentIndex - 1)}>
              <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
            </button>
            <div className="diagonal-puntos">
              {items.map((item, index) => (
                <button
                  key={item.clave}
                  type="button"
                  aria-label={`${index + 1} de ${items.length}: ${item.titulo}`}
                  aria-current={currentIndex === index ? "true" : undefined}
                  className={currentIndex === index ? "activo" : undefined}
                  onClick={() => selectSlide(index)}
                />
              ))}
            </div>
            <button type="button" aria-label="Siguiente" disabled={currentIndex === maxIndex} onClick={() => selectSlide(currentIndex + 1)}>
              <ChevronRight aria-hidden="true" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

export default DiagonalCarousel;
