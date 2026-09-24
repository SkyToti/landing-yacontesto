"use client";

import { useEffect, useState } from "react";
import { PerspectiveCarousel } from "@/components/ui/perspective-carousel";

const DIAS = [
  { corto: "lun", numero: 12 },
  { corto: "mar", numero: 13 },
  { corto: "mié", numero: 14, hoy: true },
  { corto: "jue", numero: 15, manana: true },
  { corto: "vie", numero: 16 },
];

/**
 * Los días de la semana en la agenda del teléfono (Perspective Carousel, decorativo).
 * Empieza en «hoy» (miércoles 14) y el Director la pasa a «mañana» con el evento `yc:agenda-dia`.
 */
export function DiasAgenda({ inicial = 2 }: { inicial?: number }) {
  const [activo, setActivo] = useState(inicial);

  useEffect(() => {
    const alCambiar = (e: Event) => setActivo((e as CustomEvent<number>).detail);
    window.addEventListener("yc:agenda-dia", alCambiar);
    return () => window.removeEventListener("yc:agenda-dia", alCambiar);
  }, []);

  return (
    <PerspectiveCarousel
      className="ag-dias"
      decorativo
      activeIndex={activo}
      slideWidth={54}
      rotationStep={34}
      inactiveScale={0.82}
      items={DIAS.map((d) => ({
        clave: `${d.corto}${d.numero}`,
        titulo: `${d.corto} ${d.numero}`,
        contenido: (
          <span className={`ag-dia${d.hoy ? " hoy" : ""}${d.manana ? " manana" : ""}`}>
            {d.corto}
            <b className="cifra">{d.numero}</b>
          </span>
        ),
      }))}
    />
  );
}
