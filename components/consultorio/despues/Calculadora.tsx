import type { CSSProperties } from "react";
import { ENLACE_FUNDADOR, PRECIO } from "@/components/historia/datos";
import { ETIQUETAS, INICIAL, MARCAS, MAXIMO, PUNTOS, estadoDe, precio } from "./calculo";
import { TEXTOS_PRECIO } from "./textos";

/**
 * La calculadora del precio: PrecioInteractivo (la landing publicada) vestida con la paleta nueva. Es HTML del
 * servidor con 150 pacientes; en el navegador la conecta `conectarCalculadora` (VidaCierre), sin React. Los
 * datos son PRECIO y las mismas funciones (`mensualidad`, `escalonDe`, `detalleDe`). Sin JavaScript, el
 * deslizador se mueve pero el precio se queda en el escalón de 150.
 */
export function Calculadora() {
  const e = estadoDe(INICIAL);
  return (
    <div className="calc" data-calculadora>
      <div className="calc-inst">
        <span className="calc-etiqueta">Instalación</span>
        <p className="calc-cifra">
          <b>{precio(PRECIO.instalacionFundador)}</b>
          <s>
            <span className="solo-lectores">antes </span>
            {precio(PRECIO.instalacionLista)}
          </s>
        </p>
        <small>Precio fundador, pago único</small>
      </div>

      <div className="calc-control">
        <div className="calc-cabeza">
          <label htmlFor="pacientes">{TEXTOS_PRECIO.pregunta}</label>
          <span className="calc-cuantos" aria-hidden="true">
            {e.cuantos}
          </span>
        </div>
        <div className="calc-grafica" aria-hidden="true">
          <svg viewBox="0 0 600 220" preserveAspectRatio="none" focusable="false">
            <polygon className="calc-area" points={`0,220 ${PUNTOS} 600,220`} />
            <polyline className="calc-borde" points={PUNTOS} />
          </svg>
          {ETIQUETAS.map((et, i) => (
            <span key={i} className="calc-escalon" data-activo={e.escalon === i ? "" : undefined} style={{ left: et.left, right: et.right, top: et.top }}>
              {et.texto}
            </span>
          ))}
          <i className="calc-linea" style={{ left: e.px }} />
          <i className="calc-punto" style={{ left: e.px, top: e.py }} />
        </div>
        <input
          id="pacientes"
          type="range"
          min={0}
          max={MAXIMO}
          step={10}
          defaultValue={INICIAL}
          autoComplete="off"
          style={{ "--llenado": e.px } as CSSProperties}
          aria-valuetext={e.valuetext}
        />
        <div className="calc-marcas" aria-hidden="true">
          <span style={{ left: 0 }}>0</span>
          <span style={{ left: `${(MARCAS.hasta / MAXIMO) * 100}%`, translate: "-50% 0" }}>{MARCAS.hasta}</span>
          <span style={{ left: `${(MARCAS.hastaSegundo / MAXIMO) * 100}%`, translate: "-50% 0" }}>{MARCAS.hastaSegundo}</span>
          <span style={{ right: 0 }}>{MAXIMO.toLocaleString("es-MX")}</span>
        </div>
      </div>

      {/* Sin aria-live: el deslizador ya anuncia el precio en su aria-valuetext. */}
      <div className="calc-resultado">
        <p className="calc-mes">
          <b>{e.mes}</b>
          <span>al mes, precio fundador</span>
        </p>
        <p className="calc-detalle">{e.detalle}</p>
      </div>

      <p className="calc-atendido">
        <b>¿Qué es un paciente atendido?</b> {TEXTOS_PRECIO.atendido}
      </p>
      <p className="calc-lista">
        Al llenarse los lugares fundadores vuelve el precio de lista: {precio(PRECIO.instalacionLista)} de instalación y
        desde {precio(PRECIO.mensualidadLista)} al mes.
      </p>
      <a className="calc-boton" href={ENLACE_FUNDADOR} target="_blank" rel="noopener">
        {TEXTOS_PRECIO.boton}
      </a>
    </div>
  );
}
