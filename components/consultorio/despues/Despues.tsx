import { PASOS_INSTALACION, PREGUNTAS } from "@/components/historia/datos";
import { ENLACE_ESCRIBENOS } from "../Pastilla";
import { ManoHerramienta } from "../moli/Moli";
import { cuerpo, diademaCompleta, filtroTinta, rasgos } from "../moli/partes";
import { ENCENDIDO, mancha, telefono } from "../noche/dibujo";
import { Calculadora } from "./Calculadora";
import { CIERRE, INSTALACION, PIE, TEXTOS_PRECIO, TITULO_PREGUNTAS } from "./textos";

/** El número de la hoja de taco de cada paso: «Día 1» → 1, «Días 2 a 6» → 2–6. */
const numeroDe = (cuando: string) => cuando.replace(/^D[ií]as?\s+/, "").replace(" a ", "–");

/**
 * Instalación: los 3 pasos de PASOS_INSTALACION tal cual, cada uno con su hoja del calendario de taco
 * (el mismo de la recepción, el que se arranca en la T1).
 */
function Instalacion() {
  return (
    <section className="seccion instalacion" id="instalacion" aria-labelledby="titulo-instalacion">
      <h2 id="titulo-instalacion" className="titulo-seccion">
        {INSTALACION.titulo}
      </h2>
      <p className="texto-seccion">{INSTALACION.texto}</p>
      <ol className="taco">
        {PASOS_INSTALACION.map((p) => (
          <li key={p.cuando} className="taco-paso">
            <div className="taco-hoja" aria-hidden="true">
              <span>{p.cuando.startsWith("Días") ? "DÍAS" : "DÍA"}</span>
              <b>{numeroDe(p.cuando)}</b>
            </div>
            <div>
              <p className="taco-cuando">{p.cuando}</p>
              <h3 className="taco-que">{p.que}</h3>
              <p className="taco-detalle">{p.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Precio: los textos de la landing publicada y la calculadora, vestida con la paleta nueva. */
function Precio() {
  return (
    <section className="seccion precio" id="precio" aria-labelledby="titulo-precio" tabIndex={-1}>
      <div className="precio-frase">
        <h2 id="titulo-precio" className="titulo-seccion">
          {TEXTOS_PRECIO.titulo}
        </h2>
        <p className="texto-seccion">{TEXTOS_PRECIO.texto}</p>
        <p className="garantia">{TEXTOS_PRECIO.garantia.replace("100 %", "100 %")}</p>
        <p className="fundador">{TEXTOS_PRECIO.fundador}</p>
      </div>
      <div className="precio-tarjeta">
        <Calculadora />
      </div>
    </section>
  );
}

/** Las 7 preguntas, en <details>: se abren sin JavaScript y las encuentra el buscador de la página. */
function Preguntas() {
  return (
    <section className="seccion preguntas" id="preguntas" aria-labelledby="titulo-preguntas">
      <h2 id="titulo-preguntas" className="titulo-seccion">
        {TITULO_PREGUNTAS}
      </h2>
      <div className="preguntas-lista">
        {PREGUNTAS.map((q) => (
          <details key={q.p} className="pregunta">
            <summary>{q.p}</summary>
            <p>{q.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Moli despierto, con dos caras ya dibujadas: la de guardia y la feliz, que sale cuando lo tocan. */
function MoliCierre() {
  return (
    <div className="moli moli-cierre">
      <div className="moli-respira">
        <svg viewBox="52 0 336 400" className="moli-svg" focusable="false">
          <defs dangerouslySetInnerHTML={{ __html: filtroTinta("tinta-cierre", 7) }} />
          <g filter="url(#tinta-cierre)">
            <g dangerouslySetInnerHTML={{ __html: cuerpo() }} />
            <g className="cara-guardia" dangerouslySetInnerHTML={{ __html: rasgos("ci-g", "normal") }} />
            <g className="cara-feliz" dangerouslySetInnerHTML={{ __html: rasgos("ci-f", "feliz") }} />
            <g dangerouslySetInnerHTML={{ __html: diademaCompleta() }} />
          </g>
        </svg>
      </div>
    </div>
  );
}

const LUZ = mancha(200, 200, 192, 186, 41, 18, 0.06);

/**
 * El cierre: Moli, despierto en la luz del celular, levanta la mano con letrero. Aquí sale su nombre, la
 * única vez en la página. La pastilla se acopla al botón grande (VidaCierre).
 */
function Cierre() {
  return (
    <section className="seccion cierre" id="cierre" aria-labelledby="titulo-cierre">
      <div className="cierre-dibujo">
        <p className="solo-lectores">{CIERRE.dibujo}</p>
        <div className="cierre-escena" aria-hidden="true">
          <svg className="cierre-luz" viewBox="0 0 400 400" preserveAspectRatio="none" focusable="false">
            <path d={LUZ} />
          </svg>
          <svg className="cierre-tel" viewBox="286 540 76 118" focusable="false">
            <defs dangerouslySetInnerHTML={{ __html: filtroTinta("tinta-tel", 5) }} />
            <g filter="url(#tinta-tel)" dangerouslySetInnerHTML={{ __html: telefono(ENCENDIDO) }} />
          </svg>
          <MoliCierre />
          <ManoHerramienta id="letrero" herramienta="letrero" className="letrero-cierre" />
        </div>
        {/* Sin JavaScript no aparece: lo enciende VidaCierre. */}
        <button type="button" className="cierre-toque" aria-label={`Saluda a ${CIERRE.nombre}`} hidden />
        <p className="nota nota-cierre" aria-live="polite" />
      </div>
      <div className="cierre-texto">
        <h2 id="titulo-cierre" className="titulo-seccion">
          {CIERRE.nombre} {CIERRE.resto}
        </h2>
        <p className="texto-seccion">{CIERRE.texto}</p>
        <a className="cierre-boton" href={ENLACE_ESCRIBENOS} target="_blank" rel="noopener">
          {CIERRE.boton}
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" />
          </svg>
        </a>
      </div>
    </section>
  );
}

/** Lo que sigue al día, sobre la noche: instalación, precio, preguntas y cierre. */
export function Despues() {
  return (
    <div className="despues">
      <Instalacion />
      <Precio />
      <Preguntas />
      <Cierre />
    </div>
  );
}

/** El pie: contacto, aviso de privacidad y la clínica ficticia. */
export function Pie() {
  return (
    <footer className="pie">
      <p className="pie-marca">
        <b>YaContesto</b>
        {PIE.queEs}
      </p>
      <ul className="pie-contacto">
        <li>
          <a href={ENLACE_ESCRIBENOS} target="_blank" rel="noopener">
            WhatsApp {PIE.telefono}
          </a>
        </li>
        <li>
          <a href={`mailto:${PIE.correo}`}>{PIE.correo}</a>
        </li>
        <li>{PIE.ciudad}</li>
        <li>
          <a href="/privacidad/">Aviso de privacidad</a>
        </li>
      </ul>
      <p className="pie-chica">{PIE.ficticia}</p>
      <p className="pie-chica">{PIE.legal}</p>
    </footer>
  );
}
