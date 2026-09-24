"use client";

import { lazy, Suspense } from "react";
import type { DiagonalCarouselItem } from "@/components/ui/diagonal-carousel";

/**
 * Islas que se hidratan tarde. El HTML llega completo desde el servidor (se ve y se lee), pero
 * su JavaScript (Motion y los carruseles) no compite con la carga de la portada: React deja el
 * HTML del servidor tal cual hasta que la promesa se cumple y entonces lo hidrata (Suspense).
 */

const enServidor = typeof window === "undefined";

/** Se cumple cuando el elemento se acerca a la pantalla. */
function alAcercarse(selector: string, margen = "60% 0px"): Promise<void> {
  return new Promise((resolver) => {
    const el = document.querySelector(selector);
    if (!el || !("IntersectionObserver" in window)) return resolver();
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          observador.disconnect();
          resolver();
        }
      },
      { rootMargin: margen },
    );
    observador.observe(el);
  });
}

/** Se cumple cuando el Director ya armó la historia (el teléfono de la noche la necesita). */
function alArmarHistoria(): Promise<void> {
  return new Promise((resolver) => {
    if (window.__historiaLista) return resolver();
    window.addEventListener("yc:historia", () => resolver(), { once: true });
  });
}

const cargarPrecio = () => import("./PrecioInteractivo").then((m) => ({ default: m.PrecioInteractivo }));
const cargarDia = () => import("./CarruselDia").then((m) => ({ default: m.CarruselDia }));
const cargarDias = () => import("./DiasAgenda").then((m) => ({ default: m.DiasAgenda }));

const Precio = lazy(() => (enServidor ? cargarPrecio() : alAcercarse("#precio").then(cargarPrecio)));
const Dia = lazy(() => (enServidor ? cargarDia() : alAcercarse("#dia").then(cargarDia)));
const Dias = lazy(() => (enServidor ? cargarDias() : alArmarHistoria().then(cargarDias)));

export function PrecioPerezoso() {
  return (
    <Suspense fallback={null}>
      <Precio />
    </Suspense>
  );
}

export function CarruselDiaPerezoso({ items }: { items: DiagonalCarouselItem[] }) {
  return (
    <Suspense fallback={null}>
      <Dia items={items} />
    </Suspense>
  );
}

export function DiasAgendaPerezoso() {
  return (
    <Suspense fallback={null}>
      <Dias />
    </Suspense>
  );
}
