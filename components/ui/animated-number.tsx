"use client";

import { m } from "motion/react";
import { MotionPerezoso } from "./motion-perezoso";
import { cn } from "@/lib/utils";

/**
 * Animated Number de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su idea: cada dígito es una tira vertical del 0 al 9 que se desliza hasta el
 * valor nuevo, en la dirección del cambio. Cambios: recibe la cifra ya formateada («$1,490»)
 * y deja quietos los símbolos; las tiras se miden en `em` (sin leer alturas del DOM ni
 * re-render al montar); las columnas se cuentan desde la derecha, para que las unidades no
 * cambien de lugar cuando la cifra gana un dígito; resorte en lugar de ease, y
 * `motion/react` con reducedMotion="user". El número se anuncia por fuera (aria-valuetext).
 */
const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const caracteres = value.split("");
  return (
    <MotionPerezoso>
      <span className={cn("numero-animado", className)} aria-hidden="true">
        {caracteres.map((c, i) => {
          const desdeDerecha = caracteres.length - i;
          if (!/\d/.test(c)) {
            return (
              <span key={`s${desdeDerecha}`} className="numero-simbolo">
                {c}
              </span>
            );
          }
          return (
            <span key={`d${desdeDerecha}`} className="numero-ventana">
              <m.span
                className="numero-tira"
                initial={false}
                animate={{ y: `${-Number(c)}em` }}
                transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.6 }}
              >
                {DIGITOS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </m.span>
            </span>
          );
        })}
      </span>
    </MotionPerezoso>
  );
}

export default AnimatedNumber;
