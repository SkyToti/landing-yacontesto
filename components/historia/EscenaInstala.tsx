import { PASOS_INSTALACION } from "./datos";

/** Tu parte: 15 minutos. La línea de tiempo se dibuja con el scroll (DrawSVG). */
export function EscenaInstala() {
  return (
    <section className="cap cap-instala" id="instala" data-tema="dia" aria-labelledby="titulo-instala">
      <div className="escena escena-instala" data-escena="instala">
        <div className="frase" data-frase-instala>
          <h2 id="titulo-instala" className="titular-2">
            Tu parte dura 15 minutos.
          </h2>
          <p className="cuerpo">Lo demás lo hacemos nosotros.</p>
        </div>
        <div className="ruta">
          <svg className="ruta-linea ruta-horizontal" viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
            <path className="ruta-guia" d="M8 8H992" />
            <path className="ruta-trazo" d="M8 8H992" data-ruta-trazo />
          </svg>
          <svg className="ruta-linea ruta-vertical" viewBox="0 0 16 1000" preserveAspectRatio="none" aria-hidden="true">
            <path className="ruta-guia" d="M8 8V992" />
            <path className="ruta-trazo" d="M8 8V992" data-ruta-trazo />
          </svg>
          <ol className="ruta-pasos">
            {PASOS_INSTALACION.map((p) => (
              <li key={p.cuando} className="paso" data-paso-instala>
                <b className="paso-cuando cifra">{p.cuando}</b>
                <p className="paso-que">{p.que}</p>
                <span className="paso-detalle">{p.detalle}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
