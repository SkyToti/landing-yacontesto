import type { CSSProperties } from "react";
import { ManoHerramienta, Moli } from "../moli/Moli";
import { LIENZO, PUNTOS } from "../noche/dibujo";
import { AGENDA } from "../noche/textos";
import { Rejilla, Telefono } from "../piezas";
import { CAJA_ANA, PUNTOS_DIA, ana, bolita, caraLetrero, diaFondo, diaFrente, luna, manecilla, sol } from "./dibujo";
import { CAJA_CONSULTORIO, RECORTE_FONDO, consultorio } from "./sillon";
import {
  AGENDA_COMPU,
  CHAT_MEDIODIA,
  CHAT_TARDE,
  CONTACTO_MEDIODIA,
  CONTACTO_TARDE,
  NOTA_CITA,
  ROTULOS_DIA,
  ROTULOS_MEDIODIA,
  ROTULOS_TARDE,
  TIRA,
  type Rotulo,
} from "./textos";

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

/**
 * Los rótulos de día (las 09:00, las 11:20 y las 16:05): en la misma columna que los de la noche, en
 * tinta sobre el papel. Algunos llevan letra chica debajo.
 */
export function RotulosDia({ rotulos = ROTULOS_DIA, desde = 7, className = "pasos-dia" }: { rotulos?: readonly Rotulo[]; desde?: number; className?: string }) {
  return (
    <ol className={`pasos ${className}`}>
      {rotulos.map((r, i) => (
        <li key={r.titulo} className="rotulo rotulo-dia" data-rotulo={i + desde}>
          <h2 className="titulo-paso">{r.titulo}</h2>
          <p className="texto-paso">{r.texto}</p>
          {r.chica && <p className="letra-chica">{r.chica}</p>}
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
          {/* El consultorio sigue a la derecha de la recepción: la cámara llega ahí en la T3. */}
          <svg
            className="dib-consultorio"
            viewBox={`${CAJA_CONSULTORIO.x} 0 ${CAJA_CONSULTORIO.ancho} ${LIENZO.alto}`}
            preserveAspectRatio="none"
            focusable="false"
          >
            <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: consultorio() }} />
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

/** Los rótulos de las 11:20 (P10 a P12). */
export function RotulosMediodia() {
  return <RotulosDia rotulos={ROTULOS_MEDIODIA} desde={10} className="pasos-mediodia" />;
}

/**
 * El primer plano de las 11:20: el celular de la clínica con otro paciente, Ana abajo a la izquierda y
 * Moli a la derecha. Moli contesta el cierre, le pasa el chat a Ana como estafeta (la estafeta y el
 * puño son dos capas: el puño la suelta) y se va a saltitos; Ana contesta desde el mismo celular.
 */
export function CercaMediodia() {
  return (
    <div className="plano mediodia-cerca" aria-hidden="true">
      <Telefono dia="Hoy" className="tel-mediodia" chat={CHAT_MEDIODIA} contacto={CONTACTO_MEDIODIA} />
      <Ana className="ana-mediodia" />
      <ManoHerramienta id="estafeta" herramienta="estafeta" className="estafeta-cerca" />
      <ManoHerramienta id="puno" herramienta="puno" className="puno-cerca" />
      <Moli id="mm" className="moli-cerca moli-mediodia" caraCine="normal" caraQuieta="feliz" />
    </div>
  );
}

/** Los rótulos de las 16:05 (P13 a P15). */
export function RotulosTarde() {
  return <RotulosDia rotulos={ROTULOS_TARDE} desde={13} className="pasos-tarde" />;
}

/**
 * La tira de la semana: los días arriba (hoy es el jueves) y, abiertos, el viernes y el sábado hora por
 * hora. La cita de Jorge es un bloque aparte, encima de las 17:00 del viernes: el director lo carga al
 * hueco de las 10:00 del sábado. Su lugar lo dicen dos variables (`--c` columna, `--f` fila): sin
 * JavaScript ya está en el sábado y pintada (tarde.css).
 */
function Tira() {
  return (
    <div className="tira">
      <div className="tira-cabeza">
        <b>{TIRA.semana}</b>
        <span>Tu calendario</span>
      </div>
      <ol className="tira-dias">
        {TIRA.dias.map((d) => (
          <li key={d.num} className={"hoy" in d ? "es-hoy" : "abierto" in d ? "es-abierto" : undefined}>
            <small>{d.corto}</small>
            {d.num}
          </li>
        ))}
      </ol>
      <div className="tira-cols">
        {TIRA.columnas.map((c, i) => (
          <div key={c.dia} className="tira-col" data-col={i}>
            <b className="tira-dia">{c.dia}</b>
            <ol className="tira-filas">
              {c.filas.map((f) => (
                <li key={f.hora} className={`fila fila-${f.tipo}`} data-fila={`${i}-${f.hora}`}>
                  <span className="fila-hora">{f.hora}</span>
                  <span className="fila-caja">{f.texto}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <div className="blq-jorge">
          <span className="pinta" />
          <span className="jorge-texto">
            {TIRA.cita.servicio}
            <small>{TIRA.cita.nombre}</small>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * El primer plano de las 16:05: el celular de la clínica con el chat de Jorge, la tira de la semana y
 * Moli con la lupa (revisa) y las pinzas (carga la cita). Al fondo, recortado del mismo dibujo, el
 * doctor atiende en el sillón con las manos ocupadas.
 */
export function CercaTarde() {
  return (
    <div className="plano tarde-cerca" aria-hidden="true">
      <div className="tarde-fondo">
        <svg viewBox={RECORTE_FONDO} focusable="false">
          <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: consultorio() }} />
        </svg>
      </div>
      <Telefono dia="Hoy" className="tel-tarde" chat={CHAT_TARDE} contacto={CONTACTO_TARDE} />
      <Tira />
      <ManoHerramienta id="lupa-t" herramienta="lupa" className="lupa-tarde" />
      <ManoHerramienta id="pinzas" herramienta="pinzas" className="pinzas-tarde" />
      <Moli id="mt" className="moli-cerca moli-tarde" caraCine="normal" caraQuieta="feliz" />
    </div>
  );
}
