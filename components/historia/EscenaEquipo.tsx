import { Pause, UserRound } from "lucide-react";
import { Chat } from "./Chat";
import { CHAT_EQUIPO } from "./datos";
import { Telefono } from "./Telefono";

/**
 * 11:20. Algo delicado: el paciente pide al doctor, el asistente responde el cierre de la
 * clínica y deja de contestar ese chat (pasar_a_humano). Ana, de recepción, sigue en el mismo
 * WhatsApp desde su celular. No se promete ningún aviso: la recepcionista lo ve en su chat.
 */
export function EscenaEquipo() {
  return (
    <section className="cap cap-equipo" id="equipo" data-tema="dia" aria-labelledby="titulo-equipo">
      <div className="escena escena-equipo" data-escena="equipo">
        <div className="frase frase-lateral" data-frase-equipo>
          <h2 id="titulo-equipo" className="titular-2">
            ¿Algo delicado? Se lo deja a tu equipo.
          </h2>
          <p className="cuerpo">Y deja de contestar ese chat.</p>
        </div>
        <div className="equipo-escenario">
          <Telefono
            id="tel-equipo"
            className="tel-equipo"
            hora="11:20"
            frente={<Chat burbujas={CHAT_EQUIPO} prefijo="e" />}
            etiquetaFrente="Conversación de ejemplo a las 11:20: un paciente pide hablar con el doctor sobre su tratamiento. El asistente le responde que enseguida una persona del equipo le va a escribir y deja de contestar. A las 11:26 escribe Ana, de recepción."
          />
          <p className="nota nota-pausa" data-nota="pausa">
            <Pause aria-hidden="true" strokeWidth={2} />
            <span>Tu asistente deja de contestar este chat.</span>
          </p>
          <p className="nota nota-ana" data-nota="ana">
            <UserRound aria-hidden="true" strokeWidth={1.9} />
            <span>Ana contesta desde el WhatsApp de la clínica, en su celular.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
