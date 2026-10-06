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

/**
 * Las 11:20 (`GUION-LANDING.md`, escena 3): un paciente pide hablar con el doctor y el chat pasa a tu
 * equipo. Textos nuevos del paso 3: Diego los aprobó tal cual el 5-oct-2026 (~23:50).
 *
 * Cotejado el 5-oct-2026 contra `recepcionista-ia-whatsapp` (`main` = 7e6ef5a):
 * - P10 le pasa el chat a tu equipo ............... src/brain.ts (herramienta `pasar_a_humano`: «Úsala
 *                                                    SIEMPRE que el paciente pida hablar con una persona»)
 *       con el cierre que tú elijas ................ `fallbackToHuman` del config de cada clínica; el
 *                                                    paciente recibe la frase entrecomillada tal cual
 *                                                    (`cierreParaHumano`). La de abajo es la del demo
 *                                                    (`config/config.example.json`), con todo y el «le».
 * - P11 deja de contestar en esa conversación ..... src/state.ts (`setModoHumano`, `modoHumanoVigente`):
 *       aunque el paciente siga escribiendo          lo que escribe el paciente se guarda y el bot no
 *                                                    contesta. Vence a los `humanModeMinutes` (demo: 15)
 *                                                    contados desde lo último que escribió tu equipo
 *                                                    (`registrarMensajeDeRecepcionista`): por eso
 *                                                    «mientras tu equipo lo atiende».
 * - P12 tu equipo contesta desde el mismo WhatsApp  coexistencia con Dualhook (la app de WhatsApp Business
 *                                                    del celular de la clínica, el mismo número); lo que
 *                                                    escribe ahí llega como eco y calla al bot en ese chat
 *                                                    (`parseEcos`, src/whatsapp.ts).
 * Lo que NO hay (regla 2): ningún aviso, alerta ni campanita para Ana. Ve el chat porque el paciente
 * escribió, como cualquier chat de su WhatsApp. La estafeta es la metáfora del traspaso, no un aviso.
 */
export const ROTULOS_MEDIODIA = [
  { titulo: "Si piden a una persona, le pasa el chat a tu equipo.", texto: "Con el mensaje de cierre que tú elijas." },
  { titulo: "Y deja de contestar en esa conversación.", texto: "Mientras tu equipo lo atiende, aunque el paciente siga escribiendo." },
  { titulo: "Tu equipo contesta desde el mismo WhatsApp.", texto: "El de la clínica, en el celular de siempre." },
];

/** El paciente de las 11:20, en la cabecera del chat (clínica ficticia, regla 6). */
export const CONTACTO_MEDIODIA = { iniciales: "LR", nombre: "Luis R." };

/** El chat de las 11:20: la petición, el cierre del demo (verde), un mensaje que ya no contesta y Ana (crema). */
export const CHAT_MEDIODIA = [
  { de: "paciente", texto: "Hola, quiero hablar con el doctor sobre mi tratamiento", hora: "11:20" },
  { de: "clinica", texto: "Con gusto 🙂 Enseguida una persona de nuestro equipo le va a escribir.", hora: "11:20" },
  { de: "paciente", texto: "Es sobre mi ortodoncia", hora: "11:21" },
  { de: "equipo", texto: "Hola, Luis, soy Ana, de recepción. Ya le comento al doctor. ¿Te puede llamar hoy en la tarde?", hora: "11:26" },
] as const;
