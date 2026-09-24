"use client";

import { useSyncExternalStore } from "react";
import { DiagonalCarousel, type DiagonalCarouselItem } from "@/components/ui/diagonal-carousel";
import { fijarEstado, leer, leerInicial, suscribir } from "@/lib/historia-estado";

const ANGOSTO = "(max-width: 899px)";
const leerActiva = leer("diaActiva");
const leerActivaInicial = leerInicial("diaActiva");

function suscribirAncho(avisar: () => void) {
  const consulta = matchMedia(ANGOSTO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/**
 * El resto del día en el Diagonal Carousel. Con la historia animada, el scroll decide cuál está
 * activa (el Director escribe el estado); si el visitante toca una tarjeta o usa las flechas, se
 * le pide al Director que lleve el scroll hasta ella (`yc:ir-dia`).
 */
export function CarruselDia({ items }: { items: DiagonalCarouselItem[] }) {
  const activo = useSyncExternalStore(suscribir, leerActiva, leerActivaInicial);
  const angosto = useSyncExternalStore(suscribirAncho, () => matchMedia(ANGOSTO).matches, () => false);
  const tamano = angosto ? { slide: 230, bajada: 96 } : { slide: 300, bajada: 124 };

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
        if (window.__historiaLista) window.dispatchEvent(new CustomEvent("yc:ir-dia", { detail: indice }));
        else fijarEstado({ diaActiva: indice });
      }}
    />
  );
}
