import { Check } from "lucide-react";
import { DiasAgendaPerezoso } from "./Perezosos";

/** Posición en la rejilla de 09:00 a 14:00 (cinco horas = 100 %). */
function franja(desde: string, hasta: string) {
  const minutos = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return (hh - 9) * 60 + mm;
  };
  return { top: `${(minutos(desde) / 300) * 100}%`, height: `${((minutos(hasta) - minutos(desde)) / 300) * 100}%` };
}

function Horas() {
  return (
    <>
      {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"].map((h, i) => (
        <div key={h} className="ag-h" style={{ top: `${i * 20}%` }}>
          <span className="cifra">{h}</span>
        </div>
      ))}
    </>
  );
}

/**
 * El reverso del teléfono: tu agenda del jueves 15, lo que el asistente revisa antes de contestar.
 * Dos horas ocupadas, la hora pedida que choca, las dos libres que ofrece, un bloque de otro
 * calendario (lee todos los que le conectes) y, al final, la cita nueva: «servicio — nombre»,
 * como la escribe el bot en Google Calendar.
 */
export function AgendaTelefono() {
  return (
    <div className="ag">
      <div className="ag-cabeza">
        <b>Tu agenda</b>
        <span>Lo que revisa antes de contestar</span>
      </div>
      <DiasAgendaPerezoso />
      <div className="ag-rejilla">
        <Horas />
        <div className="blq ocu" data-ag="ocupado" style={franja("09:00", "09:50")}>
          Ocupado
        </div>
        <div className="blq ocu mitad-izq" data-ag="ocupado" style={franja("10:00", "10:30")}>
          Ocupado
        </div>
        <div className="blq pedida mitad-der" data-ag="pedida" style={franja("10:00", "10:30")}>
          10:00 pedida
        </div>
        <div className="blq libre mitad-izq" data-ag="libre-1030" style={franja("10:30", "11:10")}>
          10:30 libre
        </div>
        <div className="blq libre mitad-der" data-ag="libre-1100" style={franja("11:00", "11:40")}>
          11:00 libre
        </div>
        <div className="blq otro" data-ag="ocupado" style={franja("12:00", "13:30")}>
          Ocupado en otro calendario
        </div>
        <div className="blq cita" data-ag="cita" style={franja("10:30", "11:10")}>
          <Check aria-hidden="true" strokeWidth={2.6} />
          <span className="cita-titulo">Limpieza dental (profilaxis) — Mariana López</span>
        </div>
        <div className="ag-globo" data-ag="globo" style={{ top: "46%" }}>
          Cita creada en tu Google Calendar
          <em className="cifra">23:49</em>
        </div>
      </div>
    </div>
  );
}

/** La agenda de la mañana, en grande: la cita de anoche ya está ahí. */
export function AgendaDia() {
  return (
    <div className="dia-agenda" role="img" aria-label="Agenda del jueves 15 de octubre: la cita de limpieza dental de Mariana López a las 10:30, que tu asistente agendó anoche a las 23:49.">
      <div className="dp-cabeza">
        <b>Jueves 15</b>
        <span>Tu Google Calendar</span>
      </div>
      <div className="dp-rejilla">
        <Horas />
        <div className="blq ocu" style={franja("09:00", "09:50")}>
          Ocupado
        </div>
        <div className="blq ocu" style={franja("10:00", "10:30")}>
          Ocupado
        </div>
        <div className="blq cita" data-cita-dia style={franja("10:30", "11:10")}>
          <span className="cita-titulo">Limpieza dental (profilaxis) — Mariana López</span>
        </div>
        <div className="blq otro" style={franja("12:00", "13:30")}>
          Ocupado
        </div>
        <span className="dp-nota" data-nota-dia>
          La agendó tu asistente anoche, a las <b className="cifra">23:49</b>
        </span>
      </div>
    </div>
  );
}
