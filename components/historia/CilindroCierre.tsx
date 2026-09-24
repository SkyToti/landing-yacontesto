import type { CSSProperties } from "react";
import { NOTIFICACIONES } from "./datos";
import { Notificacion } from "./Notificacion";

/**
 * El cilindro del cierre: la misma geometría del Cylinder Carousel de la portada, pero sin
 * JavaScript. Gira con una animación CSS de `transform` (la hace el compositor), como el
 * componente original de Vengeance, y no hidrata nada. Es decorativo: los mensajes ya se
 * leyeron en la portada. Con movimiento reducido, se queda quieto.
 */
export function CilindroCierre() {
  const n = NOTIFICACIONES.length;
  return (
    <div className="tambor tambor-cierre" aria-hidden="true">
      <div className="tambor-escena">
        <div className="tambor-giro tambor-giro-solo" style={{ ["--n" as string]: n } as CSSProperties}>
          {NOTIFICACIONES.map((notif, i) => (
            <div key={notif.hora} className="tambor-carta" style={{ ["--i" as string]: i } as CSSProperties}>
              <Notificacion datos={notif} tono={(i + 2) % 5} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
