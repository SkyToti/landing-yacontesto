import { ShieldCheck } from "lucide-react";
import { GlowBorderCard } from "@/components/ui/glow-border-card";
import { PrecioPerezoso } from "./Perezosos";

/**
 * Precio. Modelo de cobro estándar (CLAUDE.md §2): la instalación se paga el día que se hace y,
 * si a los 14 días la clínica no sigue, se devuelve el 100 %. Sin número de lugares fundadores:
 * decisión de Diego del 1-oct-2026 (es cierto, no hay que actualizarlo y no inventa escasez).
 */
export function SeccionPrecio() {
  return (
    <section className="cap cap-precio" id="precio" data-tema="dia" aria-labelledby="titulo-precio" tabIndex={-1}>
      <div className="precio">
        <div className="precio-frase" data-precio-frase>
          <h2 id="titulo-precio" className="titular-2">
            Solo pagas por lo que atiendes.
          </h2>
          <p className="cuerpo">Una instalación y una mensualidad según cuántos pacientes atiende tu asistente.</p>
          <p className="garantia">
            <ShieldCheck aria-hidden="true" strokeWidth={1.75} />
            <span>Pagas la instalación el día que la hacemos. Si a los 14 días decides no seguir, te devolvemos el 100&nbsp;%.</span>
          </p>
          <p className="fundador">
            Precio fundador para las primeras clínicas.
          </p>
        </div>
        <GlowBorderCard className="precio-tarjeta" data-precio-tarjeta>
          <PrecioPerezoso />
        </GlowBorderCard>
      </div>
    </section>
  );
}
