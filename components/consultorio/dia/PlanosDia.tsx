import type { CSSProperties } from "react";
import { ManoHerramienta, Moli } from "../moli/Moli";
import { LIENZO, PUNTOS } from "../noche/dibujo";
import { AGENDA } from "../noche/textos";
import { Rejilla, Telefono } from "../piezas";
import { CAJA_ANA, PUNTOS_DIA, ana, bolita, caraLetrero, diaFondo, diaFrente, luna, manecilla, sol } from "./dibujo";
import { AGENDA_COMPU, NOTA_CITA, ROTULOS_DIA } from "./textos";

const caja = `0 0 ${LIENZO.ancho} ${LIENZO.alto}`;

/** Una caja del lienzo como porcentajes de la lámina (la lámina tiene la proporción del lienzo). */
const enLamina = (x: number, y: number, ancho: number, alto: number): CSSProperties => ({
  left: `${(x / LIENZO.ancho) * 100}%`,
  top: `${(y / LIENZO.alto) * 100}%`,
  width: `${(ancho / LIENZO.ancho) * 100}%`,
  height: `${(alto / LIENZO.alto) * 100}%`,
});

const { reloj, cielo, letrero } = PUNTOS_DIA;
const CAJA_RELOJ = enLamina(reloj.x - reloj.r, reloj.y - reloj.r, 2 * reloj.r, 2 * reloj.r);
const [ax, ay, aw, ah] = CAJA_ANA.split(" ").map(Number);
const { x: anaX, y: anaY, escala: anaE } = PUNTOS_DIA.ana;
const CAJA_ANA_LAMINA = enLamina(anaX + ax * anaE, anaY + ay * anaE, aw * anaE, ah * anaE);

/** Ana como capa: un SVG de trazo fino que el director mueve entero (y sus brazos y ojos por dentro). */
function Ana({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <div className={`ana ${className}`} style={style}>
      <svg viewBox={CAJA_ANA} focusable="false" dangerouslySetInnerHTML={{ __html: ana() }} />
    </div>
  );
}

/** Los rótulos de las 09:00: van en la misma columna que los de la noche, en tinta sobre el papel. */
export function RotulosDia() {
  return (
    <ol className="pasos pasos-dia">
      {ROTULOS_DIA.map((r, i) => (
        <li key={r.titulo} className="rotulo rotulo-dia" data-rotulo={i + 7}>
          <h2 className="titulo-paso">{r.titulo}</h2>
          <p className="texto-paso">{r.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * El plano general de día: el mismo consultorio en papel. Está debajo de la noche desde el principio;
 * en la transición T1 la noche se arranca como la hoja del calendario y lo deja ver.
 */
export function PlanoDia() {
  return (
    <div className="plano plano-dia" aria-hidden="true">
      <div className="encuadre">
        <div className="lamina lamina-dia">
          <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
            <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: diaFondo() }} />
          </svg>
          <div className="cielo" style={enLamina(cielo.x, cielo.y, cielo.ancho, cielo.alto)}>
            <svg className="astro luna" viewBox="0 0 71 69" focusable="false" dangerouslySetInnerHTML={{ __html: luna() }} />
            <svg className="astro sol" viewBox="0 0 71 69" focusable="false" dangerouslySetInnerHTML={{ __html: sol() }} />
          </div>
          <div className="manecilla manecilla-hora" style={CAJA_RELOJ}>
            <svg viewBox="0 0 80 80" focusable="false">
              <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: manecilla("hora") }} />
            </svg>
          </div>
          <div className="manecilla manecilla-minuto" style={CAJA_RELOJ}>
            <svg viewBox="0 0 80 80" focusable="false">
              <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: manecilla("minuto") }} />
            </svg>
          </div>
          <div className="letrero" style={enLamina(letrero.x, letrero.y, letrero.ancho, letrero.alto)}>
            <svg className="letrero-cara letrero-cerrado" viewBox="0 0 84 37" focusable="false" dangerouslySetInnerHTML={{ __html: caraLetrero("CERRADO") }} />
            <svg className="letrero-cara letrero-abierto" viewBox="0 0 84 37" focusable="false" dangerouslySetInnerHTML={{ __html: caraLetrero("ABIERTO") }} />
          </div>
          {/* Ana va delante del letrero (su brazo lo voltea) y detrás del mostrador. */}
          <Ana className="ana-general" style={CAJA_ANA_LAMINA} />
          <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
            <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: diaFrente() }} />
          </svg>
          <Moli
            id="md"
            className="moli-general moli-dia"
            caraCine="dormita"
            caraQuieta="feliz"
            style={{
              left: `${(PUNTOS.moli.x / LIENZO.ancho) * 100}%`,
              top: `${(PUNTOS.moli.y / LIENZO.alto) * 100}%`,
              width: `${(PUNTOS.moli.ancho / LIENZO.ancho) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * El primer plano de día: la computadora con la agenda (P8) y luego el celular de la clínica con el
 * chat de Mariana (P9). Moli le enseña la cita a Ana con la mano y se hace a un lado.
 */
export function CercaDia() {
  return (
    <div className="plano dia-cerca" aria-hidden="true">
      <div className="compu">
        <div className="compu-pantalla">
          <div className="compu-cabeza">
            <b>{AGENDA.dia}</b>
            <span>Tu calendario</span>
          </div>
          <div className="compu-agenda">
            <Rejilla bloques={AGENDA_COMPU} />
            <span className="nota nota-agendo">
              <svg viewBox="0 0 30 26" focusable="false">
                <path d="M26 23C15 21 8 15 6 4M2 9L6 3L11 8" />
              </svg>
              <span>
                {NOTA_CITA[0]}
                <br />
                {NOTA_CITA[1]}
              </span>
            </span>
          </div>
        </div>
      </div>
      <Telefono dia="Ayer" className="tel-dia" />
      <Ana className="ana-cerca" />
      <span className="ancla-ana" />
      <ManoHerramienta id="senala" herramienta="senala" className="senala-cerca" />
      <Moli id="mdc" className="moli-cerca moli-dia-cerca" caraCine="normal" caraQuieta="guino" />
    </div>
  );
}

/** La hoja del 14, hecha bolita, que sale volando al final del arrancón. */
export function Bolita() {
  return (
    <div className="bolita" aria-hidden="true">
      <svg viewBox="0 0 80 80" focusable="false" dangerouslySetInnerHTML={{ __html: bolita() }} />
    </div>
  );
}
