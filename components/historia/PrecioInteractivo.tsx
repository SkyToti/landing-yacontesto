"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ENLACE_FUNDADOR, PRECIO, mensualidad } from "./datos";

const MAXIMO = 1200;
const TOPE_GRAFICA = 2700;
const fmt = (n: number) => n.toLocaleString("es-MX");
const precio = (n: number) => `$${fmt(n)}`;

function escalonDe(p: number) {
  if (p <= PRECIO.escalones.hasta) return 0;
  if (p <= PRECIO.escalones.hastaSegundo) return 1;
  return 2;
}

function detalleDe(p: number) {
  const { hasta, hastaSegundo, porPacienteExtra, segundo } = PRECIO.escalones;
  if (p <= hasta) return `Incluye hasta ${hasta} pacientes atendidos al mes.`;
  if (p <= hastaSegundo) return `Pasaste de ${hasta}: incluye hasta ${hastaSegundo} pacientes atendidos.`;
  return `${precio(segundo)} más $${porPacienteExtra} por cada uno de los ${fmt(p - hastaSegundo)} pacientes arriba de ${hastaSegundo}.`;
}

// La escalera en coordenadas de la gráfica (600 × 220).
const x = (p: number) => (p / MAXIMO) * 600;
const y = (total: number) => 220 - (total / TOPE_GRAFICA) * 220;
const { base, hasta, segundo, hastaSegundo } = PRECIO.escalones;
const PUNTOS = [
  [0, y(base)],
  [x(hasta), y(base)],
  [x(hasta), y(segundo)],
  [x(hastaSegundo), y(segundo)],
  [600, y(mensualidad(MAXIMO))],
]
  .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
  .join(" ");

/**
 * El control del precio: «¿cuántos pacientes te escriben al mes?» → el escalón y el costo.
 * La luz de la tarjeta (Glow Border Card) recorre el borde conforme se arrastra.
 */
export function PrecioInteractivo() {
  const [pacientes, setPacientes] = useState(150);
  const raiz = useRef<HTMLDivElement>(null);
  const total = mensualidad(pacientes);
  const escalon = escalonDe(pacientes);

  useEffect(() => {
    const borde = raiz.current?.closest(".brillo-tarjeta")?.querySelector<HTMLElement>(".brillo-borde");
    borde?.style.setProperty("--glow-angle", `${140 + (pacientes / MAXIMO) * 360}deg`);
  }, [pacientes]);

  const px = (pacientes / MAXIMO) * 100;
  const py = (1 - total / TOPE_GRAFICA) * 100;

  return (
    <div className="tarjeta-precio" ref={raiz}>
      <div className="tp-inst">
        <div>
          <span className="tp-etiqueta">Instalación</span>
          <div className="tp-cifra">
            <b className="cifra">{precio(PRECIO.instalacionFundador)}</b>
            <s className="cifra">
              <span className="solo-lectores">antes </span>
              {precio(PRECIO.instalacionLista)}
            </s>
          </div>
        </div>
        <small>Precio fundador, pago único</small>
      </div>

      <div className="tp-sep" />

      <div className="tp-control">
        <div className="tp-cabeza">
          <label htmlFor="pacientes">¿Cuántos pacientes distintos te escriben al mes?</label>
          <span className="tp-cuantos cifra" aria-hidden="true">
            {fmt(pacientes)} pacientes
          </span>
        </div>
        <div className="grafica" aria-hidden="true">
          <svg viewBox="0 0 600 220" preserveAspectRatio="none">
            <polygon className="grafica-area" points={`0,220 ${PUNTOS} 600,220`} />
            <polyline className="grafica-borde" points={PUNTOS} />
            <line className="grafica-base" x1="0" y1="220" x2="600" y2="220" />
          </svg>
          <span className="g-et" data-activo={escalon === 0 ? "" : undefined} style={{ left: "1%", top: `${(y(base) / 220) * 100}%` }}>
            {precio(base)}
          </span>
          <span className="g-et" data-activo={escalon === 1 ? "" : undefined} style={{ left: `${(hasta / MAXIMO) * 100 + 1}%`, top: `${(y(segundo) / 220) * 100}%` }}>
            {precio(segundo)}
          </span>
          <span className="g-et g-et-extra" data-activo={escalon === 2 ? "" : undefined} style={{ left: "68%", top: "74%" }}>
            + ${PRECIO.escalones.porPacienteExtra} por paciente
          </span>
          <i className="g-linea" style={{ left: `${px}%` }} />
          <i className="g-punto" style={{ left: `${px}%`, top: `${py}%` }} />
        </div>
        <input
          id="pacientes"
          type="range"
          min={0}
          max={MAXIMO}
          step={10}
          value={pacientes}
          onChange={(e) => setPacientes(Number(e.target.value))}
          style={{ ["--llenado" as string]: `${px}%` }}
          aria-valuetext={`${fmt(pacientes)} pacientes al mes: ${precio(total)} al mes`}
        />
        <div className="marcas" aria-hidden="true">
          <span style={{ left: 0 }}>0</span>
          <span style={{ left: `${(hasta / MAXIMO) * 100}%`, transform: "translateX(-50%)" }}>{hasta}</span>
          <span style={{ left: `${(hastaSegundo / MAXIMO) * 100}%`, transform: "translateX(-50%)" }}>{hastaSegundo}</span>
          <span style={{ right: 0 }}>{fmt(MAXIMO)}</span>
        </div>
      </div>

      <div className="tp-resultado">
        <div className="tp-mes" data-escalon={escalon}>
          <AnimatedNumber className="cifra" value={precio(total)} />
          <span className="solo-lectores">{precio(total)}</span>
          <span className="tp-al-mes">al mes, precio fundador</span>
        </div>
        <p className="tp-detalle">{detalleDe(pacientes)}</p>
      </div>

      <AnimatedTooltip
        className="tp-ayuda"
        variant="indis"
        ancho={300}
        alto={150}
        icono={<Info aria-hidden="true" strokeWidth={1.75} />}
        content="Una persona distinta que tu asistente atendió en el mes, con todos sus mensajes. Si escribe diez veces, cuenta una."
      >
        ¿Qué es un paciente atendido?
      </AnimatedTooltip>

      <p className="tp-lista">
        Al llenarse los lugares fundadores vuelve el precio de lista: {precio(PRECIO.instalacionLista)} de instalación y{" "}
        {precio(PRECIO.mensualidadLista)} al mes, con <span className="pendiente">escalera por confirmar</span>.
      </p>

      <AnimatedButton href={ENLACE_FUNDADOR} className="tp-boton">
        Pedir el precio fundador por WhatsApp
      </AnimatedButton>
    </div>
  );
}
