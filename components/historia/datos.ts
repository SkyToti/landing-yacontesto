/**
 * Todo el texto de la historia en un solo lugar.
 *
 * Regla 2 del proyecto: cada frase describe algo que el asistente hace HOY, verificado
 * contra `recepcionista-ia-whatsapp/src/` (23-sep-2026):
 * - contesta con la información de la clínica ............ prompt.ts (config de la clínica)
 * - revisa todos los calendarios antes de ofrecer una hora .. calendar.ts (calendariosDeLectura), brain.ts (ver_horarios_ocupados)
 * - ofrece solo horas libres y no agenda encima de otra .... brain.ts (horas libres calculadas, agendar_cita)
 * - deja la cita en Google Calendar ....................... calendar.ts (cuerpoEvento: «servicio — nombre»)
 * - le deja el chat a una persona y deja de contestar ...... brain.ts (pasar_a_humano, modo humano)
 * - atiende a varios a la vez, cada uno en su turno ........ queue.ts (encolarPorUsuario)
 * - reagenda y cancela por mensaje ........................ brain.ts (reagendar_cita, cancelar_cita)
 * - se acuerda de la conversación ......................... state.ts (historial por paciente)
 *
 * La clínica, los pacientes y sus mensajes son ficticios (regla 6): los precios y el cierre
 * «Con gusto 🙂 Enseguida una persona…» salen de `config.example.json`, la clínica demo.
 */

export const WHATSAPP_VENTAS = "522206395955";

export function enlaceWhatsApp(texto: string) {
  return `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(texto)}`;
}

export const ENLACE_DEMO = enlaceWhatsApp("Hola, quiero ver la demo del asistente");
export const ENLACE_DEMO_CLINICA = enlaceWhatsApp("Hola, quiero ver la demo del asistente para mi clínica");
export const ENLACE_FUNDADOR = enlaceWhatsApp("Hola, me interesa el precio fundador para mi clínica");

/** Lo que escriben los pacientes, a toda hora: el cilindro de la portada y del cierre. */
export type Notificacion = {
  dia: string;
  hora: string;
  quien: string;
  iniciales: string;
  texto: string;
};

export const NOTIFICACIONES: Notificacion[] = [
  { dia: "mié", hora: "23:47", quien: "Mariana L.", iniciales: "ML", texto: "Hola, ¿cuánto cuesta la limpieza?" },
  { dia: "sáb", hora: "07:12", quien: "Jorge R.", iniciales: "JR", texto: "¿Tienen lugar el sábado?" },
  { dia: "lun", hora: "14:05", quien: "Paty S.", iniciales: "PS", texto: "¿Aceptan tarjeta?" },
  { dia: "dom", hora: "01:30", quien: "Luis M.", iniciales: "LM", texto: "Me duele una muela, ¿me pueden ver?" },
  { dia: "vie", hora: "20:40", quien: "Karla V.", iniciales: "KV", texto: "¿Dónde están?" },
  { dia: "mar", hora: "06:55", quien: "Tomás G.", iniciales: "TG", texto: "¿Puedo cambiar mi cita?" },
  { dia: "jue", hora: "22:18", quien: "Rocío P.", iniciales: "RP", texto: "¿Atienden niños?" },
  { dia: "dom", hora: "13:02", quien: "Ernesto D.", iniciales: "ED", texto: "¿La primera consulta cuesta?" },
  { dia: "mié", hora: "18:26", quien: "Lupita H.", iniciales: "LH", texto: "¿Hacen limpieza profunda?" },
  { dia: "lun", hora: "08:03", quien: "Andrés C.", iniciales: "AC", texto: "Necesito cancelar mi cita" },
];

/** Los pasos de la noche: cada uno es una capacidad real, en el orden en que la usa. */
export const PASOS_NOCHE = [
  { titulo: "Contesta al instante.", texto: "Con tus precios, tus horarios y tu tono." },
  { titulo: "Antes de ofrecer una hora, revisa tu agenda.", texto: "Todos los calendarios que le conectes." },
  { titulo: "Si ya está ocupada, ofrece otra.", texto: "Solo las horas que siguen libres." },
  { titulo: "Y deja la cita en tu calendario.", texto: "En tu Google Calendar, a las 23:49." },
  { titulo: "Listo. Con tu consultorio cerrado.", texto: "Nadie de tu equipo tuvo que contestar." },
];

/** La conversación de la noche (clínica demo: limpieza dental, $700, 40 minutos). */
export type Burbuja = { de: "paciente" | "clinica"; texto: string; hora: string };

export const CHAT_NOCHE: Burbuja[] = [
  { de: "paciente", texto: "Hola, ¿cuánto cuesta la limpieza?", hora: "23:47" },
  {
    de: "clinica",
    texto: "¡Hola! La limpieza dental cuesta $700 y dura 40 minutos. ¿Quieres que te agende una cita? 😊",
    hora: "23:47",
  },
  { de: "paciente", texto: "Sí, mañana a las 10", hora: "23:48" },
  { de: "clinica", texto: "Mañana a las 10:00 ya está ocupado. Tengo libre 10:30 u 11:00, ¿cuál prefieres?", hora: "23:48" },
  { de: "paciente", texto: "10:30. Soy Mariana López", hora: "23:48" },
  {
    de: "clinica",
    texto: "Listo, Mariana. Tu cita quedó para el jueves 15 de octubre a las 10:30 a. m.: limpieza dental. ¡Te esperamos!",
    hora: "23:49",
  },
];

/** A media mañana: el paciente pide a una persona y el asistente se hace a un lado. */
export const CHAT_EQUIPO: (Burbuja & { quien?: string })[] = [
  { de: "paciente", texto: "Hola, quiero hablar con el doctor sobre mi tratamiento", hora: "11:20" },
  { de: "clinica", texto: "Con gusto 🙂 Enseguida una persona de nuestro equipo le va a escribir.", hora: "11:20" },
  { de: "clinica", texto: "Hola, soy Ana, de recepción. Ya le comento al doctor, ¿me dices tu nombre?", hora: "11:26", quien: "Ana" },
];

/** El resto del día (Diagonal Carousel): una capacidad por tarjeta. */
export const TARJETAS_DIA = [
  { id: "varios", hora: "12:30", titulo: "Contesta a varios a la vez.", texto: "Cada paciente en su conversación, sin cruzarlas." },
  { id: "mueve", hora: "16:05", titulo: "Mueve una cita por mensaje.", texto: "Y la cambia en tu calendario." },
  { id: "cancela", hora: "18:40", titulo: "Cancela sin llamadas.", texto: "La hora queda libre para otro paciente." },
  { id: "memoria", hora: "Días después", titulo: "Se acuerda de la conversación.", texto: "No vuelve a preguntar lo que ya le dijeron." },
] as const;

export const PASOS_INSTALACION = [
  { cuando: "Día 1", que: "Nos cuentas de tu clínica.", detalle: "Servicios, precios y horarios. 15 minutos." },
  { cuando: "Días 2 a 6", que: "Lo configuramos y lo pruebas.", detalle: "Conectamos contigo tu WhatsApp y tu calendario, y lo afinamos." },
  { cuando: "Día 7", que: "Empieza a contestar.", detalle: "En tu WhatsApp, a cualquier hora." },
];

/**
 * Precio fundador (CLAUDE.md §2, confirmado por Diego el 22-sep-2026): instalación $2,900
 * (de lista $5,900); mensualidad por escalera: $990 hasta 300 pacientes atendidos al mes,
 * $1,490 hasta 800 y $3 por paciente arriba de 800.
 * Decidido por Diego el 1-oct-2026: la página no dice cuántos lugares fundadores quedan, y el
 * precio de lista se presenta como «desde $1,490 al mes», sin escalones de lista publicados.
 */
export const PRECIO = {
  instalacionFundador: 2900,
  instalacionLista: 5900,
  mensualidadLista: 1490,
  escalones: { base: 990, hasta: 300, segundo: 1490, hastaSegundo: 800, porPacienteExtra: 3 },
};

export function mensualidad(pacientes: number) {
  const { base, hasta, segundo, hastaSegundo, porPacienteExtra } = PRECIO.escalones;
  if (pacientes <= hasta) return base;
  return segundo + Math.max(0, pacientes - hastaSegundo) * porPacienteExtra;
}

const fmtPacientes = (n: number) => n.toLocaleString("es-MX");

/** En qué escalón cae: 0 = hasta 300, 1 = hasta 800, 2 = arriba de 800. */
export function escalonDe(pacientes: number) {
  if (pacientes <= PRECIO.escalones.hasta) return 0;
  if (pacientes <= PRECIO.escalones.hastaSegundo) return 1;
  return 2;
}

/** La frase bajo la mensualidad de la calculadora. */
export function detalleDe(pacientes: number) {
  const { hasta, hastaSegundo, porPacienteExtra, segundo } = PRECIO.escalones;
  if (pacientes <= hasta) return `Incluye hasta ${hasta} pacientes atendidos al mes.`;
  if (pacientes <= hastaSegundo) return `Pasaste de ${hasta}: incluye hasta ${hastaSegundo} pacientes atendidos.`;
  return `${fmtPacientes(segundo)} más ${porPacienteExtra} por cada uno de los ${fmtPacientes(pacientes - hastaSegundo)} pacientes arriba de ${hastaSegundo}.`;
}

/**
 * Las preguntas. Las 6 de la landing anterior (23-sep-2026), re-cotejadas contra el bot (`7e6ef5a`) el
 * 7-oct-2026, más «¿Contesta audios?» (guion de R-1). Lo que cambió y por qué:
 * - «¿Y si le contesta mal?»: decía «Tiene prohibido inventar datos» y «Si no sabe algo… le deja el chat».
 *   La regla existe (`src/prompt.ts`: «NUNCA inventes precios…»), pero el hallazgo 42 de AUDITORIA.md
 *   (6-oct) midió que ante lo que no está en el config (un seguro) inventó, y otra vez no pasó el chat. Ahora
 *   dice que puede pasar y qué se hace: probarlo en la instalación y cargar esas respuestas (`faqs` del
 *   config). Lo que sí funciona: pedir a una persona → `pasar_a_humano` y el cierre de la clínica.
 * - «¿Tengo que cambiar mi número?»: suma la semana de uso que pide la coexistencia (Dualhook, CLAUDE.md §4),
 *   como la letra chica de P20.
 * - «¿Contesta audios?»: `AVISO_SOLO_TEXTO` y `avisoParaMensajeNoTexto` (`src/brain.ts`): a un audio,
 *   foto, ubicación, sticker o documento contesta una sola vez «Por aquí solo leo texto, ¿me lo escribes?» y
 *   el paciente sigue con el bot. Con la coexistencia el mensaje llega igual a la app de la clínica.
 * Las otras cuatro siguen siendo ciertas: varios chats a la vez (`encolarPorUsuario`, en orden por
 * paciente), citas en Google Calendar, 7 días (PASOS_INSTALACION) y mes a mes sin plazo forzoso (plan que
 * Diego aprobó para Sonata el 23-sep).
 * Diego aprobó tal cual las tres nuevas (N2, N3 y N4 del guion) el 7-oct-2026.
 */
export const PREGUNTAS = [
  {
    p: "Ya tengo recepcionista. ¿Para qué lo quiero?",
    r: "No la reemplaza: la cubre cuando ella no puede. De noche, en domingo, en su hora de comida y cuando entran tres chats al mismo tiempo. Las citas que agenda quedan en tu Google Calendar y las conversaciones, en tu WhatsApp.",
  },
  {
    p: "¿Y si le contesta mal a un paciente?",
    r: "Puede pasar, sobre todo con lo que no está en tu información: si le preguntan por un seguro que no le contaste, puede contestar de más. Por eso, en la instalación lo probamos contigo con esas preguntas y le cargamos tus respuestas. Tiene prohibido dar diagnósticos y recetas, y si el paciente pide a una persona, le deja el chat a tu equipo. Cada conversación queda en tu WhatsApp, y tienes 14 días para probarlo.",
  },
  {
    p: "¿Contesta audios?",
    r: "No: solo lee texto. Si un paciente le manda un audio, una foto o un documento, le pide una vez que se lo escriba. El mensaje sí llega al WhatsApp de tu clínica, así que tu equipo lo puede escuchar.",
  },
  {
    p: "¿Tengo que cambiar mi número de WhatsApp?",
    r: "No. El asistente contesta en el número de tu clínica y tu equipo sigue usando WhatsApp Business en su celular, con los mismos chats. Solo necesita estar en la app de WhatsApp Business desde hace una semana o más.",
  },
  {
    p: "¿Necesito instalar algo o aprender un sistema?",
    r: "No. Nosotros lo configuramos. Tú sigues contestando desde tu WhatsApp y ves tus citas en tu Google Calendar.",
  },
  {
    p: "¿En cuánto tiempo queda listo?",
    r: "En 7 días desde que nos compartes la información de tu clínica.",
  },
  {
    p: "¿Y si después quiero cancelar?",
    r: "Es mes a mes, sin plazo forzoso ni penalización. Tus citas viven en tu propio Google Calendar, así que se quedan contigo.",
  },
];
