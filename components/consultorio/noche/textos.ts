/**
 * Los textos de la escena de las 23:47 (`proyecto/ventas/rebranding/GUION-LANDING.md`, escena 1).
 *
 * Regla 2 del proyecto: cada rótulo describe algo que el asistente hace HOY. Cotejado el 5-oct-2026
 * contra `recepcionista-ia-whatsapp` (`main` = 7e6ef5a):
 * - P1 contesta con los datos de la clínica ...... src/prompt.ts (config.services, config.tone)
 * - P2 revisa todos los calendarios .............. src/brain.ts (ver_horarios_ocupados), src/calendar.ts (calendariosDeLectura)
 * - P3 ofrece solo lo libre ...................... src/agenda.ts (tramosLibres, horasDeInicio)
 * - P4 deja la cita en Google Calendar ........... src/calendar.ts (crearCita, cuerpoEvento: «servicio — nombre»)
 * - P5 solo confirma lo que sí agendó ............ src/promesas.ts (decir ≠ hacer), src/fechas.ts y el
 *                                                  cotejo del día de la semana (hallazgos 36 y 40)
 * La conversación es la de la clínica ficticia del demo (`CHAT_NOCHE`, regla 6).
 */

export { CHAT_NOCHE, enlaceWhatsApp } from "@/components/historia/datos";

/** P0 es la portada (el H1). P1 a P6, un rótulo por pausa. */
export const ROTULOS_NOCHE = [
  { titulo: "Contesta al instante.", texto: "Con tus precios, tus horarios y tu tono." },
  { titulo: "Antes de ofrecer una hora, revisa tu agenda.", texto: "Todos los calendarios que le conectes." },
  { titulo: "Si ya está ocupada, ofrece otra.", texto: "Solo las horas que siguen libres." },
  { titulo: "Y deja la cita en tu Google Calendar.", texto: "A las 23:49, con tu consultorio cerrado." },
  { titulo: "Solo confirma lo que ya quedó agendado.", texto: "Con el día y la fecha revisados antes de mandarlo." },
  { titulo: "Nadie de tu equipo tuvo que contestar.", texto: "" },
];

/** La agenda del jueves 15: lo que revisa antes de contestar (la misma que la landing publicada). */
export const AGENDA = {
  dia: "Jueves 15 de octubre",
  horas: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"],
  bloques: [
    { id: "ocupado-0900", desde: "09:00", hasta: "09:50", tipo: "ocupado", texto: "Ocupado", lado: "todo" },
    { id: "ocupado-1000", desde: "10:00", hasta: "10:30", tipo: "ocupado", texto: "Ocupado", lado: "izq" },
    { id: "pedida", desde: "10:00", hasta: "10:30", tipo: "pedida", texto: "10:00 pedida", lado: "der" },
    { id: "libre-1030", desde: "10:30", hasta: "11:10", tipo: "libre", texto: "10:30 libre", lado: "izq" },
    { id: "libre-1100", desde: "11:00", hasta: "11:40", tipo: "libre", texto: "11:00 libre", lado: "der" },
    { id: "otro", desde: "12:00", hasta: "13:30", tipo: "otro", texto: "Ocupado · otro calendario", lado: "todo" },
  ],
  cita: { desde: "10:30", hasta: "11:10", texto: "Limpieza dental (profilaxis) — Mariana López" },
} as const;

/** Posición en la rejilla de 09:00 a 14:00 (cinco horas = 100 %). */
export function franja(desde: string, hasta: string) {
  const minutos = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return (hh - 9) * 60 + mm;
  };
  return { top: `${(minutos(desde) / 300) * 100}%`, height: `${((minutos(hasta) - minutos(desde)) / 300) * 100}%` };
}
