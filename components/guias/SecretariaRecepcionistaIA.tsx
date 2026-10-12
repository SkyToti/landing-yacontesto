import { PRECIO, enlaceWhatsApp } from "@/components/historia/datos";
import { CIERRE, TEXTOS_PRECIO } from "@/components/consultorio/despues/textos";

/**
 * Guía 1 (SEO-2, 12-oct-2026): «Secretaria o recepcionista con IA para dentistas: qué hace, qué no y cuánto
 * cuesta en México». Contesta «secretaria ia para dentistas», «agente de ia para dentistas», «recepcionista ia
 * whatsapp» y «recepcionista virtual mexico» (autocompletado de Google México, PLAN-SEO.md).
 *
 * Cotejo con el bot (`recepcionista-ia-whatsapp`, main = f379e46, 12-oct-2026), regla 2:
 * - contesta a cualquier hora con la información de la clínica ...... prompt.ts (config de la clínica)
 * - revisa todos los calendarios y ofrece 2 o 3 horas libres ......... calendar.ts (calendariosDeLectura),
 *   brain.ts (ver_horarios_ocupados), prompt.ts («CÓMO AGENDAR»)
 * - deja la cita en Google Calendar con servicio y nombre ............ calendar.ts (cuerpoEvento)
 * - cambia y cancela las que agendó; las del equipo, a una persona .... brain.ts (buscar_mis_citas,
 *   reagendar_cita, cancelar_cita), prompt.ts (si no la encuentra, pasar_a_humano)
 * - varios pacientes a la vez, cada uno en su turno .................. queue.ts (encolarPorUsuario)
 * - pasa el chat a una persona y deja de contestar ..................... brain.ts (pasar_a_humano, modo humano)
 * - se calla si la recepcionista escribe desde el celular .............. whatsapp.ts (parseEcos), state.ts
 *   (no se dice «contesta»: los audios de ella no llegan como eco)
 * - dolor o urgencia: empatía y valoración, sin diagnóstico ........... prompt.ts (REGLAS IMPORTANTES)
 * - audios, fotos y documentos: pide una vez que lo escriban .......... brain.ts (AVISO_SOLO_TEXTO)
 * - no manda recordatorios: reminders.ts existe pero nada lo llama; no hay reportes ni panel (regla 2)
 * - puede contestar de más con lo que no está en su información ........ AUDITORIA.md, hallazgo 42; mismo
 *   texto que «¿Y si le contesta mal?» de la portada
 * Precios, garantía, «paciente atendido» y los 7 días: los mismos textos y constantes de la portada.
 *
 * Cada cifra de fuera lleva su fuente en «Fuentes», consultada el 12-oct-2026.
 */
const pesos = (n: number) => `$${n.toLocaleString("es-MX")}`;
const { base, hasta, segundo, hastaSegundo, porPacienteExtra } = PRECIO.escalones;

const FUENTES = {
  conasami:
    "https://www.gob.mx/conasami/articulos/se-publican-en-el-diario-oficial-de-la-federacion-los-salarios-minimos-vigentes-a-partir-del-1-de-enero-de-2026",
  metaPrecios: "https://developers.facebook.com/docs/whatsapp/pricing",
  metaCambios: "https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing",
  coexistencia:
    "https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users",
  noOficiales: "https://faq.whatsapp.com/1217634902127718/?locale=es_LA",
  lfpdppp: "https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp.htm",
};

/** Para que Diego sepa que el mensaje viene de la guía. */
const ENLACE_GUIA = enlaceWhatsApp("Hola, leí su guía de la recepcionista con IA y quiero verla con los datos de mi clínica");

export function SecretariaRecepcionistaIA() {
  return (
    <>
      <p className="guia-corto">
        <b>En corto:</b> una recepcionista con IA contesta el WhatsApp de tu clínica a cualquier hora, con tus precios y
        tu agenda, y deja la cita en tu calendario. No contesta llamadas, no escucha audios y no da diagnósticos. Con
        YaContesto, el precio fundador es de {pesos(PRECIO.instalacionFundador)} de instalación y desde {pesos(base)} al
        mes.
      </p>

      <h2>Secretaria, recepcionista, asistente o agente de IA: ¿es lo mismo?</h2>
      <p>
        En una clínica dental, casi siempre sí: son nombres distintos para lo mismo. Es un programa con inteligencia
        artificial que contesta los mensajes de tus pacientes como lo haría tu recepcionista: entiende lo que te escriben
        con sus propias palabras, contesta con la información de tu clínica y aparta citas en tu agenda.
      </p>
      <p>
        No es un menú de opciones («escribe 1 para precios»): eso es un chatbot de respuestas fijas. Y tampoco es una
        «recepcionista virtual» de las que se contratan por hora: ahí te contesta una persona, a distancia.
      </p>

      <h2>Qué hace en el WhatsApp de tu clínica</h2>
      <p>
        Esto es lo que hace hoy la recepcionista con IA de YaContesto. Puedes verla en un día completo de consultorio en{" "}
        <a href="/">la página de inicio</a>.
      </p>
      <ul>
        <li>
          Contesta a cualquier hora, también de noche y en domingo, con los servicios, precios, horarios y ubicación que
          tu clínica le da.
        </li>
        <li>
          Antes de ofrecer una hora, revisa tu agenda: todos los calendarios de Google que le conectes. Ofrece dos o tres
          horas libres dentro de tu horario.
        </li>
        <li>Deja la cita en tu Google Calendar, con el servicio y el nombre del paciente.</li>
        <li>
          Cambia o cancela por mensaje las citas que agendó. Si el paciente habla de una cita que hizo tu equipo, le deja
          el chat a una persona.
        </li>
        <li>Atiende a varios pacientes al mismo tiempo, cada uno en su turno.</li>
        <li>
          Si un paciente pide hablar con una persona, le deja el chat a tu equipo y deja de contestar en esa
          conversación.
        </li>
        <li>
          Si alguien de tu equipo escribe en un chat desde el celular de la clínica, el asistente deja de contestar ahí
          para no encimarse.
        </li>
        <li>Ante un dolor o una urgencia, muestra empatía y recomienda una valoración con el dentista lo antes posible.</li>
      </ul>
      <p>
        Todo pasa en tu número: tu equipo sigue usando WhatsApp Business en el celular, con los mismos chats, y ve cada
        conversación.
      </p>

      <h2>Qué no hace</h2>
      <ul>
        <li>No contesta llamadas. Solo atiende WhatsApp.</li>
        <li>
          No escucha audios ni ve fotos. Si un paciente manda un audio, una foto o un documento, le pide una vez que se lo
          escriba. El mensaje igual llega al WhatsApp de tu clínica, así que tu equipo lo puede escuchar.
        </li>
        <li>No da diagnósticos, no receta y no da consejos médicos.</li>
        <li>No cobra ni lleva expedientes.</li>
        <li>No manda recordatorios de citas ni reportes.</li>
        <li>
          Solo sabe lo que tu clínica le da. Si le preguntan por algo que no está en tu información, como un seguro, puede
          contestar de más. Por eso, al instalarlo, lo probamos contigo con esas preguntas y le cargamos tus respuestas.
        </li>
      </ul>
      <p>
        Tampoco reemplaza a tu recepcionista: la cubre cuando ella no puede. De noche, en domingo, en su hora de comida y
        cuando entran tres chats al mismo tiempo.
      </p>

      <h2>Cuánto cuesta en México</h2>
      <p>Conviene separar dos costos: lo que cobra quien te lo instala y lo que cobra Meta, la dueña de WhatsApp.</p>

      <h3>Con YaContesto</h3>
      <p>Precio fundador, para las primeras clínicas:</p>
      <ul>
        <li>
          Instalación: {pesos(PRECIO.instalacionFundador)}, un solo pago (de lista, {pesos(PRECIO.instalacionLista)}).
        </li>
        <li>
          Mensualidad: {pesos(base)} si tu asistente atiende hasta {hasta} pacientes al mes, {pesos(segundo)} hasta{" "}
          {hastaSegundo} y {pesos(porPacienteExtra)} por cada paciente arriba de {hastaSegundo} (de lista, desde{" "}
          {pesos(PRECIO.mensualidadLista)} al mes).
        </li>
      </ul>
      <p>
        Un paciente atendido es una persona distinta que tu asistente atendió en el mes, con todos sus mensajes: si
        escribe diez veces, cuenta una. {TEXTOS_PRECIO.garantia} Después es mes a mes, sin plazo forzoso, y queda listo
        en 7 días desde que nos compartes la información de tu clínica.
      </p>

      <h3>Lo que cobra Meta</h3>
      <p>
        Meta cobra por mensaje desde el 1 de julio de 2025, pero contestarle a un paciente que te escribió no cuesta: los
        mensajes que no son plantillas, enviados mientras está abierta la ventana de atención, son gratis. El asistente
        solo le contesta a quien le escribe.
      </p>

      <h3>Para darte una idea</h3>
      <p>
        En 2026, el salario mínimo general es de $315.04 al día, unos $9,580 al mes, sin contar IMSS, aguinaldo ni
        vacaciones. La comparación no es exacta, porque el asistente no recibe pacientes en el mostrador ni contesta el
        teléfono. Lo que cambia es quién contesta a las 11 de la noche, cuando un paciente sin respuesta puede escribirle
        a otra clínica.
      </p>

      <h2>Seis preguntas antes de contratar</h2>
      <p>Le sirven para cualquier proveedor, no solo para nosotros.</p>
      <ol>
        <li>
          <b>¿Usa la plataforma oficial de WhatsApp?</b> WhatsApp dice que vincular tu cuenta a versiones no oficiales va
          contra sus condiciones y que tu cuenta se puede bloquear de forma temporal o permanente. YaContesto usa la
          plataforma oficial de Meta.
        </li>
        <li>
          <b>¿Tu equipo puede seguir contestando desde el celular?</b> Con la coexistencia de Meta, la app de WhatsApp
          Business y el asistente comparten el número y el historial de los chats. Pregunta si tu proveedor la usa. Con
          YaContesto, sí: solo pide que el número tenga una semana o más en la app de WhatsApp Business.
        </li>
        <li>
          <b>¿Revisa tu agenda de verdad?</b> Pregunta qué calendario lee. Para el asistente, lo que no está en el
          calendario conectado está libre: si tu agenda vive en una libreta, primero hay que pasarla al calendario.
        </li>
        <li>
          <b>¿Qué hace cuando no sabe algo?</b> Lo correcto es que le deje el chat a una persona. Pide que lo prueben
          contigo, antes de arrancar, con las preguntas difíciles de tu clínica.
        </li>
        <li>
          <b>¿Quién cuida los datos de tus pacientes?</b> Ante la ley de datos personales, tu clínica es la responsable de
          los datos de sus pacientes. Pide un contrato en el que el proveedor quede como encargado de tratarlos solo para
          darte el servicio. Con YaContesto va en el contrato.
        </li>
        <li>
          <b>¿Puedes probarlo sin amarrarte?</b> Pregunta por la garantía y por el plazo. Con YaContesto, si a los 14 días
          decides no seguir, te devolvemos la instalación, y después es mes a mes.
        </li>
      </ol>

      <div className="guia-cierre">
        <h2>¿Quieres verla con los datos de tu clínica?</h2>
        <p>{CIERRE.texto}</p>
        <p>
          <a className="boton-obra" href={ENLACE_GUIA} target="_blank" rel="noopener">
            {CIERRE.boton}
          </a>
        </p>
      </div>

      <h2>Fuentes</h2>
      <ul className="guia-fuentes">
        <li>
          CONASAMI,{" "}
          <a href={FUENTES.conasami}>
            «Se publican en el Diario Oficial de la Federación los salarios mínimos vigentes a partir del 1 de enero de
            2026»
          </a>
          , 9 de diciembre de 2025. El mensual es nuestro cálculo: 315.04 × 365 ÷ 12.
        </li>
        <li>
          Meta, <a href={FUENTES.metaPrecios}>«Pricing on the WhatsApp Business Platform»</a> y su{" "}
          <a href={FUENTES.metaCambios}>historial de cambios de precios</a>.
        </li>
        <li>
          Meta, <a href={FUENTES.coexistencia}>«Registrar usuarios de la app de WhatsApp Business»</a> (la coexistencia),
          actualizada el 26 de junio de 2026.
        </li>
        <li>
          WhatsApp, <a href={FUENTES.noOficiales}>«Información acerca de aplicaciones no oficiales»</a>.
        </li>
        <li>
          Cámara de Diputados,{" "}
          <a href={FUENTES.lfpdppp}>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</a> (DOF,
          20 de marzo de 2025; última reforma, 14 de noviembre de 2025).
        </li>
        <li>Lo que hace y lo que no hace el asistente sale de su código.</li>
      </ul>
      <p className="aviso-fecha">Todas las fuentes se consultaron el 12 de octubre de 2026.</p>
    </>
  );
}
