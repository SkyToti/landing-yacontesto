import { AnimatedButton } from "@/components/ui/animated-button";
import { CylinderCarousel } from "@/components/ui/cylinder-carousel";
import { MorphText } from "@/components/ui/morph-text";
import { AgendaTelefono } from "./Agenda";
import { Chat } from "./Chat";
import { CHAT_NOCHE, ENLACE_DEMO, NOTIFICACIONES, PASOS_NOCHE } from "./datos";
import { Notificacion, diaCompleto } from "./Notificacion";
import { Telefono } from "./Telefono";

export const ANUNCIOS_TAMBOR = NOTIFICACIONES.map(
  (n, i) => `Mensaje ${i + 1} de ${NOTIFICACIONES.length}, ${diaCompleto(n.dia)} a las ${n.hora}: ${n.texto}`,
);

/**
 * La demo de la noche en texto, siempre en el árbol de accesibilidad: el teléfono entra con la
 * historia (oculto hasta que el scroll llega) y quien avanza con lector no mueve el scroll. El
 * teléfono, entonces, va aria-hidden: esto lo sustituye, en el mismo orden.
 */
function TranscripcionNoche() {
  return (
    <div className="solo-lectores">
      <p>Conversación de ejemplo en WhatsApp, con una clínica ficticia:</p>
      <ol>
        {CHAT_NOCHE.map((b, i) => (
          <li key={i}>
            {b.de === "paciente" ? "Paciente" : "Asistente"}, {b.hora}: «{b.texto}»
          </li>
        ))}
      </ol>
      <p>
        Antes de ofrecer una hora, el asistente revisa tu agenda del jueves 15: a las 9:00 y a las 10:00 ya está ocupado,
        a las 10:30 y a las 11:00 hay lugar, y de 12:00 a 13:30 hay un bloque de otro calendario. La cita de las 10:30 queda
        en tu Google Calendar a las 23:49.
      </p>
    </div>
  );
}

export function ListaMensajes() {
  return (
    <ul className="solo-lectores">
      {NOTIFICACIONES.map((n) => (
        <li key={n.hora}>
          {diaCompleto(n.dia)}, {n.hora}: «{n.texto}»
        </li>
      ))}
    </ul>
  );
}

/**
 * 23:47. La portada y la noche: los pacientes escriben a toda hora; el de las 23:47 cae al
 * WhatsApp, el asistente contesta, revisa tu agenda, ofrece lo libre y deja la cita.
 */
export function EscenaNoche() {
  const primera = NOTIFICACIONES[0];
  return (
    <section className="cap cap-noche" id="noche" data-tema="noche" aria-labelledby="titulo-portada">
      <div className="escena escena-noche" data-escena="noche">
        <div className="halo" data-halo aria-hidden="true" />

        <div className="portada" data-portada>
          <h1 id="titulo-portada" className="titular-1 h1" data-h1>
            <span className="h1-linea">Tu WhatsApp contesta solo,</span>{" "}
            <MorphText className="h1-linea h1-morph" words={["a las 11 p. m.", "en domingo", "a la hora de la comida", "a cualquier hora"]} />
          </h1>
          <p className="entrada portada-entrada">Una recepcionista con inteligencia artificial para tu clínica dental.</p>
          <div className="acciones">
            <AnimatedButton href={ENLACE_DEMO}>Ver la demo por WhatsApp</AnimatedButton>
            <a className="pista" href="#paso-1">
              <i aria-hidden="true" />o desliza: aquí te la contamos
            </a>
          </div>
        </div>

        {/* Después del titular en el DOM (orden de foco y de lectura); a la vista lo acomoda el CSS. */}
        <CylinderCarousel
          id="portada"
          className="tambor-portada"
          etiqueta="Mensajes que llegan a una clínica a toda hora. Usa las flechas para girarlos."
          anuncios={ANUNCIOS_TAMBOR}
          lista={<ListaMensajes />}
          bucle
        >
          {NOTIFICACIONES.map((n, i) => (
            <Notificacion key={n.hora} datos={n} tono={i % 5} />
          ))}
        </CylinderCarousel>

        <ol className="frases-pasos" data-frases>
          {PASOS_NOCHE.map((p, i) => (
            <li key={p.titulo} className="frase" id={`paso-${i + 1}`} data-paso={i + 1}>
              <h2 className="titular-2">{p.titulo}</h2>
              <p className="cuerpo">{p.texto}</p>
            </li>
          ))}
        </ol>

        <div className="vuelo" data-vuelo aria-hidden="true">
          <div className="vuelo-notif">
            <span className="notif-av">{primera.iniciales}</span>
            <div className="notif-cuerpo">
              <div className="notif-cabeza">
                <span className="notif-app">WhatsApp Business</span>
                <span className="notif-cuando">
                  <span className="notif-dia">{primera.dia}</span>
                  <span className="notif-hora cifra">{primera.hora}</span>
                </span>
              </div>
              <b className="notif-quien">{primera.quien}</b>
              <p className="notif-texto">{primera.texto}</p>
            </div>
          </div>
        </div>

        <TranscripcionNoche />
        <Telefono
          id="tel-noche"
          className="tel-noche"
          oculto
          hora="23:47"
          frente={<Chat burbujas={CHAT_NOCHE} prefijo="n" />}
          etiquetaFrente="Conversación de ejemplo en WhatsApp. A las 23:47 una paciente pregunta cuánto cuesta la limpieza. El asistente le contesta que cuesta 700 pesos y dura 40 minutos. Ella pide mañana a las 10; esa hora ya está ocupada y el asistente le ofrece 10:30 u 11:00. Ella elige 10:30 y el asistente le confirma la cita para el jueves 15 de octubre."
          reverso={<AgendaTelefono />}
          etiquetaReverso="Tu agenda del jueves 15: dos horas ocupadas, la hora pedida que choca, dos horas libres, un bloque de otro calendario y la cita nueva a las 10:30."
        />

        <p className="etiqueta-ficticia" data-ficticia>
          Ejemplo con una clínica ficticia.
        </p>
      </div>
    </section>
  );
}
