import type { ReactElement } from "react";
import { Check } from "lucide-react";
import { CarruselDiaPerezoso } from "./Perezosos";
import { TARJETAS_DIA } from "./datos";

type Clave = (typeof TARJETAS_DIA)[number]["id"];

/** 12:30 · Tres pacientes a la vez: cada uno en su turno, ninguno espera al otro (queue.ts). */
function Varios() {
  const filas = [
    { ini: "JR", quien: "Jorge R.", texto: "¿Tienen lugar hoy?" },
    { ini: "PS", quien: "Paty S.", texto: "¿Cuánto cuesta la resina?" },
    { ini: "RP", quien: "Rocío P.", texto: "¿Atienden niños?" },
  ];
  return (
    <div className="mini mini-varios" aria-hidden="true">
      {filas.map((f, i) => (
        <div key={f.ini} className="fila-chat" style={{ ["--orden" as string]: i }}>
          <span className="fila-av">{f.ini}</span>
          <span className="fila-texto">
            <b>{f.quien}</b>
            <span>{f.texto}</span>
          </span>
          <span className="fila-ok">
            <Check strokeWidth={3} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** 16:05 · «¿Me la pasas al jueves?»: la cita se mueve de martes a jueves (reagendar_cita). */
function Mueve() {
  return (
    <div className="mini mini-mueve" aria-hidden="true">
      <span className="mini-burbuja pac">¿Me la pasas al jueves?</span>
      <div className="mini-semana">
        <span className="col-titulo">mar 20</span>
        <span className="col-titulo">jue 22</span>
        <i className="col-dia" />
        <i className="col-dia" />
        <span className="mueve">
          Resina <b className="cifra">12:00</b>
        </span>
      </div>
    </div>
  );
}

/** 18:40 · «Ya no voy a poder ir»: la cita se borra y la hora queda libre (cancelar_cita). */
function Cancela() {
  return (
    <div className="mini mini-cancela" aria-hidden="true">
      <span className="mini-burbuja pac">Ya no voy a poder ir, ¿me la cancelas?</span>
      <div className="cancela-hueco">
        <span className="cancela antes">
          Valoración <b className="cifra">17:00</b>
        </span>
        <span className="cancela despues">
          <b className="cifra">17:00</b> libre
        </span>
      </div>
    </div>
  );
}

/** Días después · Retoma el hilo: se acuerda de su nombre y de su última cita (historial). */
function Memoria() {
  return (
    <div className="mini mini-memoria" aria-hidden="true">
      <span className="mini-burbuja pac">Hola, ¿me dan otra cita?</span>
      <span className="mini-burbuja cli">¡Claro, Mariana! ¿Otra limpieza o una valoración?</span>
    </div>
  );
}

const MINIS: Record<Clave, () => ReactElement> = { varios: Varios, mueve: Mueve, cancela: Cancela, memoria: Memoria };

function Tarjeta({ t }: { t: (typeof TARJETAS_DIA)[number] }) {
  const Mini = MINIS[t.id];
  return (
    <article className="tarjeta" data-tarjeta={t.id}>
      <span className="tj-hora cifra">{t.hora}</span>
      <h3 className="titular-3">{t.titulo}</h3>
      <p className="tj-texto">{t.texto}</p>
      <Mini />
    </article>
  );
}

/** El resto del día: cuatro capacidades reales, una por tarjeta (Diagonal Carousel). */
export function EscenaDia() {
  return (
    <section className="cap cap-dia" id="dia" data-tema="dia" aria-labelledby="titulo-dia">
      <div className="escena escena-dia" data-escena="dia">
        <div className="frase frase-arriba" data-frase-dia>
          <h2 id="titulo-dia" className="titular-2">
            Y así, todo el día.
          </h2>
        </div>
        <div className="dia-cine">
          <CarruselDiaPerezoso items={TARJETAS_DIA.map((t) => ({ clave: t.id, titulo: t.titulo, contenido: <Tarjeta t={t} /> }))} />
        </div>
        <ul className="dia-rejilla">
          {TARJETAS_DIA.map((t) => (
            <li key={t.id}>
              <Tarjeta t={t} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
