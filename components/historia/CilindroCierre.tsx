import type { CSSProperties } from "react";
import { NOTIFICACIONES } from "./datos";
import { Notificacion } from "./Notificacion";

/**
 * El cilindro del cierre: la misma geometría del Cylinder Carousel de la portada, pero sin
 * JavaScript propio y sin hidratar nada. Gira con el scroll de su escena (el Director mueve la
 * variable --giro), no solo. Es decorativo: los mensajes ya se leyeron en la portada. En la
 * versión quieta, se queda de frente.
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
