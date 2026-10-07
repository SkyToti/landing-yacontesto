import type { CSSProperties } from "react";
import { cuerpo, diademaCompleta, estafeta, filtroTinta, manoLapiz, manoLetrero, manoLupa, manoPinzas, manoSenala, punoEstafeta, rasgos, type Cara } from "./partes";

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

const HERRAMIENTAS = {
  lupa: { caja: "-130 -206 212 326", dibujo: manoLupa },
  lapiz: { caja: "-200 -90 326 190", dibujo: manoLapiz },
  // La mano que señala de la hoja, con el dedo a su largo de siempre: no se estira.
  senala: { caja: "-2 -66 240 126", dibujo: () => manoSenala() },
  // A las 11:20, la estafeta y el puño que la carga: dos capas con la misma caja, para que el puño la suelte.
  estafeta: { caja: "-160 -46 272 90", dibujo: estafeta },
  puno: { caja: "-160 -46 272 90", dibujo: punoEstafeta },
  // A las 16:05, las pinzas que cargan la cita del viernes al sábado.
  pinzas: { caja: "-200 -108 310 226", dibujo: manoPinzas },
  // En el cierre, la mano con letrero de la hoja: allá dice «¡ESCRÍBEME!»; aquí, «¡ESCRÍBENOS!», porque
  // contestas tú (guion, «Después del día»).
  letrero: { caja: "-96 -240 192 352", dibujo: () => manoLetrero("¡ESCRÍBENOS!", 27) },
};

/**
 * La mano de Moli con la herramienta de cada capacidad: la lupa para revisar tu agenda, el lápiz para
 * dejar la cita, a las 09:00 la mano que señala para enseñarle la cita a Ana (Diego, 5-oct: «la mano
 * está bien, pero el dedo que se estira se ve raro»), a las 11:20 la estafeta con su puño y a las 16:05
 * las pinzas de dentista. La lupa
 * trae su vidrio en HTML, debajo del aro dibujado: ahí el director pone la agenda aumentada.
 */
export function ManoHerramienta({ id, herramienta, className = "" }: { id: string; herramienta: keyof typeof HERRAMIENTAS; className?: string }) {
  const { caja, dibujo } = HERRAMIENTAS[herramienta];
  return (
    <div className={`mano-herramienta mano-${herramienta} ${className}`} data-mano={id} aria-hidden="true">
      {herramienta === "lupa" && (
        <div className="lupa-vidrio">
          <div className="lupa-copia" />
        </div>
      )}
      <svg viewBox={caja} className="mano-svg" focusable="false">
        <defs dangerouslySetInnerHTML={{ __html: filtroTinta(`tinta-${id}`, 9) }} />
        <g filter={`url(#tinta-${id})`} dangerouslySetInnerHTML={{ __html: dibujo() }} />
      </svg>
    </div>
  );
}
