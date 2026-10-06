import { AGENDA, CHAT_NOCHE, franja } from "./noche/textos";

type Bloque = { id: string; desde: string; hasta: string; tipo: string; texto: string; lado: string };

/**
 * La rejilla de la agenda del jueves 15: las horas, los bloques y la cita de las 10:30. La usan la
 * hoja que Moli revisa de noche y la computadora de la recepción de día.
 */
export function Rejilla({ bloques }: { bloques: readonly Bloque[] }) {
  return (
    <div className="hoja-rejilla">
      {AGENDA.horas.map((h, i) => (
        <span key={h} className="hoja-hora" style={{ top: `${i * 20}%` }}>
          {h}
        </span>
      ))}
      <div className="hoja-columna">
        {bloques.map((b) => (
          <div key={b.id} className={`blq blq-${b.tipo} lado-${b.lado}`} data-blq={b.id} style={franja(b.desde, b.hasta)}>
            <span>{b.texto}</span>
            {b.tipo === "pedida" && (
              <svg className="equis" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5L19 19M19 5L5 19" />
              </svg>
            )}
          </div>
        ))}
        <div className="blq blq-cita" style={franja(AGENDA.cita.desde, AGENDA.cita.hasta)}>
          <svg className="palomita" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12.5L9.5 18L20 6" />
          </svg>
          <span>{AGENDA.cita.texto}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * El chat de Mariana en el celular de la clínica. De noche llega mensaje por mensaje («Hoy»); a las
 * 09:00 ya está completo en el WhatsApp de la clínica y la etiqueta dice «Ayer».
 */
export function Telefono({ dia = "Hoy", className = "" }: { dia?: string; className?: string }) {
  return (
    <div className={`tel ${className}`}>
      <div className="tel-pantalla">
        <div className="tel-cabeza">
          <span className="tel-av">ML</span>
          <span className="tel-quien">
            <b>Mariana L.</b>
            <small>Ejemplo con una clínica ficticia</small>
          </span>
        </div>
        <div className="tel-chat">
          <ol className="chat">
            <li className="chat-dia">{dia}</li>
            {CHAT_NOCHE.map((b, i) => (
              <li key={i} className={`burbuja de-${b.de}`} data-burbuja={i}>
                {b.texto}
                <time>{b.hora}</time>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
