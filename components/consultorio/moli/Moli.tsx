import type { CSSProperties } from "react";
import { cuerpo, diademaCompleta, filtroTinta, manoSenala, rasgos, type Cara } from "./partes";

type Props = {
  /** Único por Moli en la página: prefija el filtro de tinta y los recortes de la boca. */
  id: string;
  className?: string;
  /** La cara con la que arranca cuando la escena se cuenta con scroll (clase `cine`). */
  caraCine: Cara;
  /** La cara de la versión quieta (sin JavaScript o con movimiento reducido). */
  caraQuieta: Cara;
  style?: CSSProperties;
};

/**
 * Moli, el títere de partes de su hoja. Las capas tienen un solo dueño cada una, como en la hoja:
 * - `.moli` (HTML): posición y saltos, con `transform` para que el celular lo componga sin redibujar.
 * - `.moli-respira` (HTML): la respiración en reposo, en CSS.
 * - `.rasgos` (SVG): la cara; cambia por piezas, nunca se redibuja a Moli.
 * - el filtro de tinta: la «línea viva», que tiembla a 12 cuadros por segundo.
 */
export function Moli({ id, className = "", caraCine, caraQuieta, style }: Props) {
  return (
    <div className={`moli ${className}`} data-moli={id} aria-hidden="true" style={style}>
      <div className="moli-respira">
        <svg viewBox="52 0 336 400" className="moli-svg" focusable="false">
          <defs dangerouslySetInnerHTML={{ __html: filtroTinta(`tinta-${id}`) }} />
          <g filter={`url(#tinta-${id})`}>
            <g dangerouslySetInnerHTML={{ __html: cuerpo() }} />
            <g className="rasgos rasgos-cine" dangerouslySetInnerHTML={{ __html: rasgos(`${id}-c`, caraCine) }} />
            <g className="rasgos rasgos-quieta" dangerouslySetInnerHTML={{ __html: rasgos(`${id}-q`, caraQuieta) }} />
            <g className="diadema" dangerouslySetInnerHTML={{ __html: diademaCompleta() }} />
          </g>
        </svg>
      </div>
      {/* La onda que sale del micrófono al contestar: HTML, para animarla sin tocar el SVG. */}
      <span className="moli-onda" />
    </div>
  );
}

/** La mano de guante que señala (a la izquierda). El dedo se estira desde el director. */
export function ManoSenala({ id, className = "" }: { id: string; className?: string }) {
  return (
    <div className={`mano ${className}`} data-mano={id} aria-hidden="true">
      <svg viewBox="-250 -70 500 140" className="mano-svg" focusable="false">
        <defs dangerouslySetInnerHTML={{ __html: filtroTinta(`tinta-${id}`, 9) }} />
        <g filter={`url(#tinta-${id})`} dangerouslySetInnerHTML={{ __html: manoSenala() }} />
      </svg>
    </div>
  );
}
