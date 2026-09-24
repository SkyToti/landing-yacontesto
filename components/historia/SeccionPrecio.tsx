import { ShieldCheck } from "lucide-react";
import { GlowBorderCard } from "@/components/ui/glow-border-card";
import { PrecioPerezoso } from "./Perezosos";

/**
 * Precio. Modelo de cobro estándar (CLAUDE.md §2): la instalación se paga el día que se hace y,
 * si a los 14 días la clínica no sigue, se devuelve el 100 %. «[N] lugares» queda marcado: lo
 * decide Diego.
 */
export function SeccionPrecio() {
  return (
    <section className="cap cap-precio" id="precio" data-tema="dia" aria-labelledby="titulo-precio" tabIndex={-1}>
      <div className="precio">
        <div className="precio-frase" data-precio-frase>
          <h2 id="titulo-precio" className="titular-2">
            Claro y sin letras chiquitas.
          </h2>
          <p className="cuerpo">Una instalación y una mensualidad según cuántos pacientes atiende tu asistente.</p>
          <p className="garantia">
            <ShieldCheck aria-hidden="true" strokeWidth={1.75} />
            <span>Pagas la instalación el día que la hacemos. Si a los 14 días decides no seguir, te devolvemos el 100&nbsp;%.</span>
          </p>
          <p className="fundador">
            Precio fundador para las primeras clínicas: quedan <span className="pendiente">[N]</span> lugares.
          </p>
        </div>
        <GlowBorderCard className="precio-tarjeta" data-precio-tarjeta>
          <PrecioPerezoso />
        </GlowBorderCard>
      </div>
    </section>
  );
}
