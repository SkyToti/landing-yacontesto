import type { Notificacion as Datos } from "./datos";

const DIAS: Record<string, string> = {
  lun: "lunes",
  mar: "martes",
  mié: "miércoles",
  jue: "jueves",
  vie: "viernes",
  sáb: "sábado",
  dom: "domingo",
};

export function diaCompleto(corto: string) {
  return DIAS[corto] ?? corto;
}

/**
 * Una notificación de WhatsApp Business en el celular de la clínica: el mensaje de un paciente
 * a cualquier hora. La hora va en ámbar (el sistema reserva el ámbar para el tiempo).
 */
export function Notificacion({ datos, tono }: { datos: Datos; tono: number }) {
  return (
    <div className="notif" data-tono={tono}>
      <span className="notif-av">{datos.iniciales}</span>
      <div className="notif-cuerpo">
        <div className="notif-cabeza">
          <span className="notif-app">WhatsApp Business</span>
          <span className="notif-cuando">
            <span className="notif-dia">{datos.dia}</span>
            <span className="notif-hora cifra">{datos.hora}</span>
          </span>
        </div>
        <b className="notif-quien">{datos.quien}</b>
        <p className="notif-texto">{datos.texto}</p>
      </div>
      <i className="notif-luz" />
      <i className="notif-brillo" />
    </div>
  );
}
