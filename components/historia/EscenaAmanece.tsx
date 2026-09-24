import { AgendaDia } from "./Agenda";

/** Una tira de dígitos para el reloj de rodillo; el Director la corre con translateY. */
function Tira({ clave, valores }: { clave: string; valores: string[] }) {
  return (
    <span className="rg-ventana">
      <span className="rg-tira" data-rg={clave}>
        {valores.map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </span>
    </span>
  );
}

const HORAS = [...Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")), "00"];
const DECENAS = ["0", "1", "2", "3", "4", "5", "0"];
const UNIDADES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/**
 * El arco del día: el camino del sol sobre Cuernavaca en octubre (sale ~06:50, se mete ~18:40).
 * El Director lo dibuja hasta la hora de la historia y mueve el punto de luz sobre él.
 */
function ArcoDelDia() {
  const marcas = [
    { h: "07", u: (7 - 6.833) / 11.833 },
    { h: "09", u: (9 - 6.833) / 11.833 },
    { h: "12", u: (12 - 6.833) / 11.833 },
    { h: "15", u: (15 - 6.833) / 11.833 },
    { h: "18", u: (18 - 6.833) / 11.833 },
  ];
  const punto = (u: number, r = 0) => ({
    x: 600 - (540 + r) * Math.cos(Math.PI * u),
    y: 380 - (320 + r) * Math.sin(Math.PI * u),
  });
  return (
    <svg className="arco" viewBox="0 0 1200 460" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-arco>
      <defs>
        <radialGradient id="sol-luz" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2b84b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f2b84b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line className="arco-horizonte" x1="0" y1="380.5" x2="1200" y2="380.5" />
      <path className="arco-guia" d="M60 380A540 320 0 0 1 1140 380" />
      <path className="arco-recorrido" d="M60 380A540 320 0 0 1 1140 380" data-arco-recorrido />
      {marcas.map((m) => {
        const a = punto(m.u, -18);
        const b = punto(m.u, 0);
        const t = punto(m.u, -46);
        return (
          <g key={m.h} className="arco-marca">
            <line x1={a.x.toFixed(1)} y1={a.y.toFixed(1)} x2={b.x.toFixed(1)} y2={b.y.toFixed(1)} />
            <text x={t.x.toFixed(1)} y={(t.y + 6).toFixed(1)} textAnchor="middle">
              {m.h}
            </text>
          </g>
        );
      })}
      <g data-sol>
        <circle r="46" fill="url(#sol-luz)" />
        <circle className="arco-sol" r="9" />
      </g>
    </svg>
  );
}

/**
 * La noche pasa (23:49 → jueves 09:00) y amanece: la agenda ya tiene la cita de anoche.
 * Muestra que la cita vive en tu calendario, no en el chat.
 */
export function EscenaAmanece() {
  return (
    <section className="cap cap-amanece" id="amanece" data-tema="dia" aria-labelledby="titulo-amanece">
      <div className="escena escena-amanece" data-escena="amanece">
        <ArcoDelDia />
        <div className="reloj-grande" aria-hidden="true" data-reloj-grande>
          <span className="rg-dia" data-rg-dia>
            mié
          </span>
          <span className="rg-hora cifra">
            <Tira clave="h" valores={HORAS} />
            <span className="rg-dos">:</span>
            <Tira clave="m1" valores={DECENAS} />
            <Tira clave="m2" valores={UNIDADES} />
          </span>
        </div>
        <div className="dia-escena" data-dia-escena>
          <div className="frase">
            <h2 id="titulo-amanece" className="titular-2">
              09:00. Tu equipo llega y la cita ya está ahí.
            </h2>
            <p className="cuerpo">La agenda amaneció con lo que se agendó de noche.</p>
          </div>
          <AgendaDia />
        </div>
      </div>
    </section>
  );
}
