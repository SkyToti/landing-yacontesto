"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DiagonalCarousel, type DiagonalCarouselItem } from "@/components/ui/diagonal-carousel";

/**
 * El resto del día en el Diagonal Carousel. Con la historia animada, el scroll decide cuál está
 * activa (evento `yc:dia`); si el visitante toca una tarjeta o usa las flechas, se le pide al
 * Director que lleve el scroll hasta ella (`yc:ir-dia`).
 */
const ANGOSTO = "(max-width: 899px)";

function suscribirAncho(avisar: () => void) {
  const consulta = matchMedia(ANGOSTO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

export function CarruselDia({ items }: { items: DiagonalCarouselItem[] }) {
  const [activo, setActivo] = useState(0);
  const angosto = useSyncExternalStore(suscribirAncho, () => matchMedia(ANGOSTO).matches, () => false);
  const tamano = angosto ? { slide: 230, bajada: 96 } : { slide: 300, bajada: 124 };

  useEffect(() => {
    const alCambiar = (e: Event) => setActivo((e as CustomEvent<number>).detail);
    window.addEventListener("yc:dia", alCambiar);
    return () => {
      window.removeEventListener("yc:dia", alCambiar);
    };
  }, []);

  return (
    <DiagonalCarousel
      className="dia-carrusel"
      etiqueta="Lo que hace tu asistente el resto del día"
      items={items}
      activeIndex={activo}
      slideSize={tamano.slide}
      verticalStep={tamano.bajada}
      rotationStep={11}
      inactiveScale={0.74}
      onActiveIndexChange={(indice) => {
        if (document.documentElement.classList.contains("cine") && window.__historiaLista) {
          window.dispatchEvent(new CustomEvent("yc:ir-dia", { detail: indice }));
        } else {
          setActivo(indice);
        }
      }}
    />
  );
}
