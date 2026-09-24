"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// El motor de Motion llega después de pintar: los componentes usan `m.*` y los rasgos se piden aparte.
const rasgos = () => import("@/lib/motion-rasgos").then((modulo) => modulo.default);

/** LazyMotion + MotionConfig con reducedMotion="user", para los componentes de Vengeance adaptados. */
export function MotionPerezoso({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={rasgos} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
