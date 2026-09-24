import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Morph Text de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su efecto: cada frase entra desenfocada y chica, se queda nítida y sale
 * desenfocada y más grande, con una sola animación CSS por frase y retrasos escalonados.
 * Cambios:
 * - Sin la hoja de Google Fonts que traía incrustada: la fuente la pone el titular.
 * - Las frases se apilan en una rejilla (no en posición absoluta): el renglón mide lo que la
 *   frase más larga y no hay brincos de layout.
 * - La primera frase ya está nítida en el primer cuadro (retraso negativo): no retrasa el LCP.
 * - Para lectores de pantalla y buscadores hay un texto fijo con la primera frase; las que rotan
 *   son aria-hidden (si no, el nombre del titular cambiaría según el segundo en que se lea).
 * - Da una sola vuelta y se queda en la primera frase (ver escenas.css).
 * - El filtro de umbral («gooey») queda opcional (`goo`): con Sofia Sans a 40–76 px aserraba los
 *   bordes en reposo.
 * - Es de servidor (no usa hooks): cero JavaScript. Con movimiento reducido, solo la primera frase.
 */
export function MorphText({
  words,
  interval = 1400,
  className,
  goo = false,
}: {
  words: string[];
  interval?: number;
  className?: string;
  goo?: boolean;
}) {
  const total = (interval / 1000) * words.length;
  // La frase i arranca en i·intervalo, corrido para que la primera ya esté en su meseta nítida.
  const entrada = total * 0.08;

  return (
    <span className={cn("morph", goo && "morph-goo", className)} style={{ "--morph-total": `${total}s` } as CSSProperties}>
      {words.map((word, i) => (
        <span
          key={word}
          className="morph-palabra"
          aria-hidden="true"
          style={{ animationDelay: `${(i * interval) / 1000 - entrada}s` }}
        >
          {word}
        </span>
      ))}
      {/* Al final: la primera frase sigue siendo :first-child (escenas.css y quieto.css). */}
      <span className="solo-lectores">{words[0]}</span>
    </span>
  );
}

export default MorphText;
