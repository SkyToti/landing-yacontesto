import type { CSSProperties } from "react";
import { Bolita, CercaDia, CercaMediodia, PlanoDia, RotulosDia, RotulosMediodia } from "../dia/PlanosDia";
import { CHAT_MEDIODIA } from "../dia/textos";
import { ManoHerramienta, Moli } from "../moli/Moli";
import { Rejilla, Telefono } from "../piezas";
import { FILTRO_FONDO, LIENZO, PUNTOS, dibujoApagado, dibujoEncendido, mancha } from "./dibujo";
import { AGENDA, CHAT_NOCHE, ROTULOS_NOCHE } from "./textos";

const caja = `0 0 ${LIENZO.ancho} ${LIENZO.alto}`;

/**
 * El iris: una ventana redonda sobre la luz grande, y adentro el dibujo, contrapuesto para que quede
 * en su lugar. Para cerrarlo, el director encoge la ventana y agranda el contenido en la misma
 * proporción: en pantalla el dibujo no se mueve y solo cambia el círculo (todo con transform).
 */
const { iris } = PUNTOS;
const pct = (v: number) => `${v * 100}%`;
const IRIS_CAJA: CSSProperties = {
  left: pct((iris.x - iris.r0) / LIENZO.ancho),
  top: pct((iris.y - iris.r0) / LIENZO.alto),
  width: pct((2 * iris.r0) / LIENZO.ancho),
  height: pct((2 * iris.r0) / LIENZO.alto),
};
const IRIS_CONTENIDO: CSSProperties = {
  left: pct(-(iris.x - iris.r0) / (2 * iris.r0)),
  top: pct(-(iris.y - iris.r0) / (2 * iris.r0)),
  width: pct(LIENZO.ancho / (2 * iris.r0)),
  height: pct(LIENZO.alto / (2 * iris.r0)),
  transformOrigin: `${pct(iris.x / LIENZO.ancho)} ${pct(iris.y / LIENZO.alto)}`,
};
/** Un punto del lienzo como porcentaje de la lámina (la lámina tiene la proporción del lienzo). */
const enLamina = (x: number, y: number): CSSProperties => ({
  left: `${(x / LIENZO.ancho) * 100}%`,
  top: `${(y / LIENZO.alto) * 100}%`,
});

/** Para lectores de pantalla: los dibujos van aria-hidden y esto los sustituye, en el mismo orden. */
function Transcripcion() {
  return (
    <div className="solo-lectores">
      <p>
        Ilustración: un consultorio dental de noche, cerrado. A las 23:47 se ilumina el celular de la clínica con un
        mensaje y Moli, la mascota de YaContesto, contesta.
      </p>
      <p>Conversación de ejemplo en WhatsApp, con una clínica ficticia:</p>
      <ol>
        {CHAT_NOCHE.map((b, i) => (
          <li key={i}>
            {b.de === "paciente" ? "Paciente" : "Asistente"}, {b.hora}: «{b.texto}»
          </li>
        ))}
      </ol>
      <p>
        Antes de ofrecer una hora, el asistente revisa la agenda del jueves 15: a las 9:00 y a las 10:00 ya está
        ocupado, a las 10:30 y a las 11:00 hay lugar, y de 12:00 a 13:30 hay un bloque de otro calendario. La cita de las
        10:30 queda en tu Google Calendar a las 23:49.
      </p>
      <p>
        A las 9:00 del jueves llega Ana, la recepcionista, y voltea el letrero a «Abierto». La cita de las 10:30 ya está
        en la agenda de la computadora, con el servicio y el nombre de la paciente, y la conversación de anoche está en
        el WhatsApp de la clínica.
      </p>
      <p>
        A las 11:20, otro paciente pide hablar con el doctor. El asistente contesta con el mensaje de cierre de la clínica,
        le pasa el chat a Ana y ya no contesta en esa conversación. Ana le escribe desde el mismo celular:
      </p>
      <ol>
        {CHAT_MEDIODIA.map((b, i) => (
          <li key={i}>
            {b.de === "paciente" ? "Paciente" : b.de === "equipo" ? "Ana, de recepción" : "Asistente"}, {b.hora}: «{b.texto}»
          </li>
        ))}
      </ol>
    </div>
  );
}

function Agenda() {
  return (
    <div className="hoja">
      <div className="hoja-cabeza">
        <b>{AGENDA.dia}</b>
        <span>Tu agenda: lo que revisa antes de contestar</span>
      </div>
      <Rejilla bloques={AGENDA.bloques} />
    </div>
  );
}

/**
 * El día en el consultorio, en una sola escena fija: 23:47 (la portada y la noche), el arrancón del
 * calendario (T1) y las 09:00 (`../dia/`).
 * 23:47: la portada y la noche. Plano general (el consultorio cerrado, la luz del celular y Moli
 * dormitando) y primer plano (el chat, la agenda y Moli actuando cada capacidad).
 * Sin JavaScript o con movimiento reducido, todo se ve quieto y completo (clase `cine` ausente).
 */
export function EscenaNoche() {
  const lg = PUNTOS.luzGrande;
  const lc = PUNTOS.luzChica;
  return (
    <section className="noche" id="noche" aria-labelledby="titular" data-pausa="0">
      <div className="escenario">
        <div className="rotulos">
          <div className="rotulo rotulo-portada" data-rotulo="0">
            <h1 id="titular" className="titular">
              Tu WhatsApp <span className="sin-corte">contesta solo,</span> <span className="sin-corte">a las 11 p. m.</span>
            </h1>
            <p className="bajada">Una recepcionista con inteligencia artificial para tu clínica dental.</p>
          </div>
          <ol className="pasos">
            {ROTULOS_NOCHE.map((r, i) => (
              <li key={r.titulo} className="rotulo" data-rotulo={i + 1}>
                <h2 className="titulo-paso">{r.titulo}</h2>
                {r.texto && <p className="texto-paso">{r.texto}</p>}
              </li>
            ))}
          </ol>
          <RotulosDia />
          <RotulosMediodia />
        </div>

        <PlanoDia />
        <div className="plano plano-general" aria-hidden="true">
          <div className="encuadre">
            <div className="lamina">
              <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
                <defs dangerouslySetInnerHTML={{ __html: FILTRO_FONDO }} />
                <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: dibujoApagado() }} />
              </svg>
              <div className="luz luz-grande">
                <div className="iris" style={IRIS_CAJA}>
                  <div className="iris-contenido" style={IRIS_CONTENIDO}>
                    <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
                      <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: dibujoEncendido("recorte-luz-grande", lg.x, lg.y, lg.r, 11) }} />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="luz luz-chica">
                <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
                  <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: dibujoEncendido("recorte-luz-chica", lc.x, lc.y, lc.r, 29, false) }} />
                </svg>
              </div>
              <Moli
                id="mg"
                className="moli-general"
                caraCine="dormita"
                caraQuieta="feliz"
                style={{ ...enLamina(PUNTOS.moli.x, PUNTOS.moli.y), width: `${(PUNTOS.moli.ancho / LIENZO.ancho) * 100}%` }}
              />
              <div className="notif" style={enLamina(282, 492)}>
                <div className="notif-tarjeta">
                  <span className="notif-av">ML</span>
                  <span className="notif-cuerpo">
                    <span className="notif-cabeza">
                      <span>WhatsApp Business</span>
                      <time>23:47</time>
                    </span>
                    <b>Mariana L.</b>
                    <span className="notif-texto">{CHAT_NOCHE[0].texto}</span>
                  </span>
                </div>
              </div>
              <span className="nota nota-quien" style={enLamina(352, 508)}>
                <span>
                  ¿quién
                  <br />
                  contesta?
                </span>
              </span>
              <span className="nota nota-z" style={enLamina(279, 538)}>
                <span>z</span>
                <span>z</span>
              </span>
            </div>
          </div>
        </div>

        <div className="plano primer-plano" aria-hidden="true">
          <svg className="luz-cerca" viewBox="0 0 400 400" preserveAspectRatio="none" focusable="false">
            <path d={mancha(200, 200, 196, 192, 41, 18, 0.05)} />
          </svg>
          <Telefono />
          <Agenda />
          <ManoHerramienta id="lupa" herramienta="lupa" className="lupa-cerca" />
          <ManoHerramienta id="lapiz" herramienta="lapiz" className="lapiz-cerca" />
          <Moli id="mc" className="moli-cerca" caraCine="dormita" caraQuieta="feliz" />
          <span className="nota nota-yo">¡yo!</span>
          <span className="nota nota-listo">¡listo!</span>
        </div>

        <CercaDia />
        <CercaMediodia />
        <Bolita />

        <p className="desliza" aria-hidden="true">
          <svg viewBox="-16 -14 32 58" focusable="false">
            <circle cx="0" cy="0" r="9" />
            <path d="M0 9v18M0 27l-8 13M0 27l8 13M0 15l-10 6M0 15l10 -2" />
          </svg>
          desliza
        </p>
      </div>
      <Transcripcion />
    </section>
  );
}
