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

/**
 * Las 16:05 (`GUION-LANDING.md`, escena 4): Jorge mueve su cita del viernes al sábado mientras el
 * doctor atiende. Textos nuevos del paso 4 (6-oct-2026): Diego los aprobó tal cual el 7-oct-2026 (~14:05),
 * con el chat y las pinzas.
 *
 * Cotejado el 6-oct-2026 contra `recepcionista-ia-whatsapp` (`main` = 7e6ef5a):
 * - P13 busca la cita del paciente ............... src/brain.ts (herramienta `buscar_mis_citas`: «las
 *                                                   próximas citas del paciente (por su número de
 *                                                   WhatsApp)»). Devuelve id, servicio y fecha, sin el
 *                                                   nombre (`textoBuscarMisCitas`): por eso Moli no lo dice.
 *       y revisa el día nuevo antes de ofrecerlo .. `ver_horarios_ocupados`: el horario del día y las
 *                                                   HORAS LIBRES ya calculadas («ofrece SOLO horas que la
 *                                                   respuesta marque como libres»). El demo abre el sábado
 *                                                   de 9:00 a 14:00 y la consulta de seguimiento dura 30 min
 *                                                   (`config/config.example.json`).
 *   letra chica: solo las que agendó el asistente  `getCitasFuturas` lee la tabla `citas` de Supabase, que
 *                                                   solo tiene las que agendó el asistente. Si el paciente
 *                                                   dice que sí tiene cita y no sale, «la hizo el personal»:
 *                                                   `pasar_a_humano` (`textoBuscarMisCitas`, 29b).
 * - P14 la cambia en tu calendario ............... `reagendar_cita` → `reagendarEvento` (src/calendar.ts):
 *                                                   mueve el evento donde esté (`localizarEvento`) y, si
 *                                                   el horario nuevo choca, no lo mueve («ocupado»).
 *       la hora del viernes queda libre .......... el evento se mueve, no se copia: el viernes 17:00 ya no
 *                                                   tiene nada en el calendario.
 * - P15 confirma la fecha nueva .................. el resultado trae «Confírmale al paciente exactamente
 *                                                   eso» (`textoCitaReagendada`) y `nuevo_dia_semana` se
 *                                                   coteja con la fecha antes de mover (hallazgo 36).
 * Lo que NO se dice: que avisa al doctor o a Ana del cambio (no existe, regla 2). Se enteran por el
 * calendario.
 */
export type Rotulo = { titulo: string; texto: string; chica?: string };

export const ROTULOS_TARDE: Rotulo[] = [
  {
    titulo: "Mueve o cancela una cita por mensaje.",
    texto: "Busca la cita del paciente y revisa el día nuevo.",
    chica: "Solo mueve las que agendó el asistente; las que hizo tu equipo, se las pasa a tu equipo.",
  },
  { titulo: "Y la cambia en tu calendario mientras tú atiendes.", texto: "La hora del viernes queda libre para otro paciente." },
  { titulo: "Le confirma la fecha nueva.", texto: "Con el día de la semana revisado antes de mandarlo." },
];

/** El paciente de las 16:05, en la cabecera del chat (clínica ficticia, regla 6). */
export const CONTACTO_TARDE = { iniciales: "JM", nombre: "Jorge M." };

/** El chat de las 16:05: la petición, las horas libres del sábado, la elección y la confirmación (verde). */
export const CHAT_TARDE = [
  { de: "paciente", texto: "Hola, ¿puedo cambiar mi cita del viernes para el sábado?", hora: "16:05" },
  {
    de: "clinica",
    texto: "Claro. Veo tu consulta de seguimiento del viernes 16 a las 5:00 p. m. El sábado tengo libre 10:00 o 12:30, ¿cuál prefieres?",
    hora: "16:05",
  },
  { de: "paciente", texto: "A las 10", hora: "16:06" },
  { de: "clinica", texto: "Listo: tu consulta quedó el sábado 17 de octubre a las 10:00 a. m. 👍", hora: "16:06" },
] as const;

/**
 * La tira de la semana del 12 de octubre (hoy es el jueves 15): el viernes 16 y el sábado 17, hora por
 * hora. La cita de Jorge (17:00 del viernes, la agendó el asistente días antes) va aparte: es la que
 * se mueve al hueco de las 10:00 del sábado. Lo que queda debajo de ella es lo libre del viernes.
 */
export const TIRA = {
  semana: "Semana del 12 de octubre",
  dias: [
    { corto: "L", num: 12 },
    { corto: "M", num: 13 },
    { corto: "M", num: 14 },
    { corto: "J", num: 15, hoy: true },
    { corto: "V", num: 16, abierto: true },
    { corto: "S", num: 17, abierto: true },
  ],
  columnas: [
    {
      dia: "Vie 16",
      filas: [
        { hora: "15:00", tipo: "ocupado", texto: "Ocupado" },
        { hora: "16:00", tipo: "ocupado", texto: "Ocupado" },
        { hora: "17:00", tipo: "libre", texto: "libre" },
        { hora: "18:00", tipo: "ocupado", texto: "Ocupado" },
      ],
    },
    {
      dia: "Sáb 17",
      filas: [
        { hora: "09:00", tipo: "ocupado", texto: "Ocupado" },
        { hora: "10:00", tipo: "libre", texto: "libre" },
        { hora: "11:00", tipo: "ocupado", texto: "Ocupado" },
        { hora: "12:30", tipo: "libre", texto: "libre" },
      ],
    },
  ],
  cita: { servicio: "Consulta de seguimiento", nombre: "Jorge M." },
} as const;

/**
 * Las 19:00 (`GUION-LANDING.md`, la transición de la escena 4 y la escena 5): tu equipo se va, la noche
 * vuelve y las tres cifras cruzan la pantalla. Textos nuevos del paso 5 (7-oct-2026): Diego los aprobó
 * tal cual el 7-oct-2026 (~14:05), con la letra chica de P20. Las cifras son las del guion, que ya estaba aprobado.
 *
 * Cotejo de cada cifra con su fuente (7-oct-2026):
 * - P17 sigue contestando, a cualquier hora ........ `PASOS_INSTALACION` (datos.ts, día 7): «En tu WhatsApp,
 *                                                     a cualquier hora.». El bot no tiene horario: contesta
 *                                                     cada mensaje que llega al webhook (es la escena de las
 *                                                     23:47, que ya está).
 * - P18 «7 días» .................................... `PASOS_INSTALACION`: «Día 7 · Empieza a contestar» (se
 *                                                     queda por decisión de Diego del 1-oct) y `PREGUNTAS`:
 *                                                     «En 7 días desde que nos compartes la información de
 *                                                     tu clínica»: de ahí el «desde que nos cuentas».
 * - P19 «14 días» y «el 100 % de la instalación» .... `CLAUDE.md` §2, modelo de cobro estándar (8-sep-2026):
 *                                                     la instalación se cobra al instalar y, si a los 14 días
 *                                                     la clínica no continúa, se devuelve el 100 %. Es la
 *                                                     «garantía de 14 días» de `PREGUNTAS`.
 * - P20 «tu mismo número» ........................... `CLAUDE.md` §4: la coexistencia con Dualhook. El número
 *                                                     sigue en la app de WhatsApp Business del celular y lo
 *                                                     que escribe tu equipo llega como eco y calla al bot
 *                                                     (`parseEcos`). `PREGUNTAS`: «¿Tengo que cambiar mi
 *                                                     número?». Letra chica: los requisitos del número (app
 *                                                     2.24.17 o más nueva y ~7 días de uso real).
 * Lo que NO se dice: que el número puede ser uno nuevo, ni que funciona con WhatsApp normal (sin la app
 * Business no hay coexistencia).
 */
export type RotuloAnochecer = Rotulo & {
  /** Sus números se pintan de verde (solo las cifras, sobre tinta: guion, escena 5). */
  verde?: boolean;
};

export const ROTULOS_ANOCHECER: RotuloAnochecer[] = [
  { titulo: "A las 7, tu equipo se va a casa.", texto: "Y los pacientes siguen escribiendo." },
  { titulo: "Tu WhatsApp sigue contestando.", texto: "A cualquier hora, también en fin de semana." },
  { titulo: "En 7 días contesta por ti.", texto: "Desde que nos cuentas de tu clínica.", verde: true },
  { titulo: "14 días para probarlo.", texto: "Si no sigues, te devolvemos el 100 % de la instalación.", verde: true },
  {
    titulo: "En el WhatsApp Business de tu clínica.",
    texto: "Tu equipo lo sigue usando en su celular.",
    chica: "Tu número tiene que estar en la app de WhatsApp Business (versión 2.24.17 o más nueva) desde hace una semana o más.",
  },
];

/** Las tres cifras que cruzan la pantalla, en grande: solo la cifra va en verde. */
export const CIFRAS = [
  { cifra: "7", palabras: ["días"] },
  { cifra: "14", palabras: ["días"] },
  { cifra: "", palabras: ["tu mismo", "número"] },
] as const;
