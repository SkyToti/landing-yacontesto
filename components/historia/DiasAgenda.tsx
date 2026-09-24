"use client";

import { useSyncExternalStore } from "react";
import { PerspectiveCarousel } from "@/components/ui/perspective-carousel";
import { leer, leerInicial, suscribir } from "@/lib/historia-estado";

const leerDia = leer("diaAgenda");
const leerDiaInicial = leerInicial("diaAgenda");

const DIAS = [
  { corto: "lun", numero: 12 },
  { corto: "mar", numero: 13 },
  { corto: "mié", numero: 14, hoy: true },
  { corto: "jue", numero: 15, manana: true },
  { corto: "vie", numero: 16 },
];

/**
 * Los días de la semana en la agenda del teléfono (Perspective Carousel, decorativo). El HTML
 * del servidor muestra el jueves 15 (el estado final); con la historia animada, el Director la
 * pone en «hoy» (miércoles 14) y la pasa a «mañana» cuando el asistente revisa la agenda.
 */
export function DiasAgenda() {
  const activo = useSyncExternalStore(suscribir, leerDia, leerDiaInicial);
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
