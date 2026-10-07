import type { CSSProperties } from "react";
import { Moli } from "../moli/Moli";
import { LIENZO, PUNTOS, SIETE, dibujoApagado, dibujoEncendido } from "../noche/dibujo";
import { CIFRAS, ROTULOS_ANOCHECER } from "./textos";

const caja = `0 0 ${LIENZO.ancho} ${LIENZO.alto}`;
const luz = PUNTOS.luzGrande;

/** Los números de un texto, en verde (solo las cifras: guion, escena 5). */
function conCifras(texto: string) {
  return texto.split(/(\d+(?:\s%)?)/).map((trozo, i) => (i % 2 ? <span key={i} className="cifra-verde">{trozo}</span> : trozo));
}

/**
 * Los rótulos de las 19:00 (P16 a P20): el de P16 todavía es de día (tinta sobre el papel); los demás,
 * de noche. Los de las cifras (P18 a P20) van debajo de su cifra en el celular (`--lineas`).
 */
export function RotulosAnochecer() {
  return (
    <ol className="pasos pasos-anochecer">
      {ROTULOS_ANOCHECER.map((r, i) => (
        <li
          key={r.titulo}
          className={`rotulo${i === 0 ? " rotulo-dia" : ""}${i >= 2 ? " rotulo-cifra" : ""}`}
          data-rotulo={i + 16}
          style={i >= 2 ? ({ "--lineas": CIFRAS[i - 2].palabras.length } as CSSProperties) : undefined}
        >
          <h2 className="titulo-paso">{r.verde ? conCifras(r.titulo) : r.titulo}</h2>
          <p className="texto-paso">{r.verde ? conCifras(r.texto) : r.texto}</p>
          {r.chica && <p className="letra-chica">{r.chica}</p>}
        </li>
      ))}
    </ol>
  );
}

/**
 * La noche que vuelve a las 19:00: el mismo consultorio de las 23:47, ahora con el reloj en 19:00 y la
 * hoja del jueves 15, la luz del celular (apagada hasta P17) y Moli, que se queda de guardia.
 * Entra por la ventana como un iris: la ventana redonda (`.anochecer-iris`) crece desde el vidrio y su
 * contenido se encoge en la misma proporción, así que en pantalla el dibujo no se mueve (todo con
 * transform, como el cierre de P6).
 */
export function PlanoAnochecer() {
  return (
    <div className="plano plano-anochecer" aria-hidden="true">
      <div className="anochecer-iris">
        <div className="anochecer-contenido">
          <div className="encuadre">
            <div className="lamina lamina-anochecer">
              <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
                <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: dibujoApagado(SIETE) }} />
              </svg>
              <div className="luz luz-siete">
                <svg className="dib" viewBox={caja} preserveAspectRatio="none" focusable="false">
                  <g filter="url(#tinta-fondo)" dangerouslySetInnerHTML={{ __html: dibujoEncendido("recorte-luz-siete", luz.x, luz.y, luz.r, 11, true, SIETE) }} />
                </svg>
              </div>
              <Moli
                id="mv"
                className="moli-general moli-guardia"
                caraCine="normal"
                caraQuieta="normal"
                style={{
                  left: `${(PUNTOS.moli.x / LIENZO.ancho) * 100}%`,
                  top: `${(PUNTOS.moli.y / LIENZO.alto) * 100}%`,
                  width: `${(PUNTOS.moli.ancho / LIENZO.ancho) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Las tres cifras de las 19:00, en grande: cruzan la pantalla con el scroll, una por pausa. Son el
 * dibujo de la prueba: lo que dicen (con su fuente) está en los rótulos de P18 a P20.
 */
export function Cifras() {
  return (
    <div className="cifras" aria-hidden="true">
      {CIFRAS.map((c, i) => (
        <p key={i} className={`cifra${c.palabras.length > 1 ? " cifra-larga" : ""}`} data-cifra={i}>
          {c.cifra && <b>{c.cifra}</b>}
          {c.palabras.map((p) => (
            <span key={p}> {p}</span>
          ))}
        </p>
      ))}
    </div>
  );
}
