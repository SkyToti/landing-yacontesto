/**
 * Los textos de la escena de las 09:00 (`proyecto/ventas/rebranding/GUION-LANDING.md`, escena 2).
 *
 * Regla 2 del proyecto: cada rótulo describe algo que el asistente hace HOY. Cotejado el 5-oct-2026
 * contra `recepcionista-ia-whatsapp` (`main` = 7e6ef5a):
 * - P7 la cita ya está, nadie la pasó a la agenda ... src/calendar.ts (crearCita escribe en el Google
 *                                                     Calendar de la clínica)
 * - P8 con el servicio, el nombre y el teléfono ...... src/calendar.ts (cuerpoEvento: título «servicio —
 *                                                     nombre»; la descripción lleva el teléfono y
 *                                                     «Agendado automáticamente por la recepcionista IA.»)
 * - P9 la conversación en el WhatsApp de la clínica .. coexistencia con Dualhook: lo que manda la API se
 *                                                     refleja en la app (COEXISTENCIA-Y-TECH-PROVIDER.md §8)
 *      y tu equipo puede seguir desde ahí ............ src/whatsapp.ts (parseEcos): lo que escribe la
 *                                                     recepcionista en la app calla al bot en ese chat
 */

export const ROTULOS_DIA = [
  { titulo: "Tu equipo llega y la cita ya está.", texto: "Nadie tuvo que pasarla a la agenda." },
  { titulo: "En tu Google Calendar.", texto: "Con el servicio, el nombre y el teléfono del paciente." },
  { titulo: "Y la conversación, en el WhatsApp de la clínica.", texto: "Tu equipo lee lo que se contestó y puede seguir desde ahí." },
];

/** La nota a mano de Moli junto a la cita (guion, escena 2). */
export const NOTA_CITA = ["la agendó tu asistente", "anoche, a las 23:49"] as const;

/**
 * La agenda del jueves 15 en la computadora, ya de día: lo ocupado, el bloque del otro calendario y
 * la cita de las 10:30. Sin las marcas de la noche («pedida», «libre»): eso era lo que revisaba Moli.
 */
export const AGENDA_COMPU = [
  { id: "ocupado-0900", desde: "09:00", hasta: "09:50", tipo: "ocupado", texto: "Ocupado", lado: "todo" },
  { id: "ocupado-1000", desde: "10:00", hasta: "10:30", tipo: "ocupado", texto: "Ocupado", lado: "todo" },
  { id: "otro", desde: "12:00", hasta: "13:30", tipo: "otro", texto: "Ocupado · otro calendario", lado: "todo" },
] as const;
