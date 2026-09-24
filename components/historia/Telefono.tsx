import type { ReactNode } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";

/**
 * El teléfono, hecho para esta marca (CSS + SVG): marco de metal verdoso con canto y botones,
 * cámara perforada, barra de estado, reflejo que sigue al giro y una pantalla que se enciende.
 * Si trae reverso, al voltearse se ve el grosor del aparato (dos cantos) y detrás, tu agenda.
 */
export function Telefono({
  id,
  hora,
  frente,
  etiquetaFrente,
  reverso,
  etiquetaReverso,
  className,
}: {
  id: string;
  hora: string;
  frente: ReactNode;
  etiquetaFrente: string;
  reverso?: ReactNode;
  etiquetaReverso?: string;
  className?: string;
}) {
  return (
    <div className={className ? `tel ${className}` : "tel"} id={id} data-tel>
      <div className="tel-giro" data-giro data-cara="frente">
        <div className="tel-cara tel-frente" role="img" aria-label={etiquetaFrente}>
          <div className="tel-pantalla">
            <BarraEstado hora={hora} />
            <i className="tel-camara" />
            {frente}
            <i className="tel-reflejo" />
            <i className="tel-destello" data-destello />
            <i className="tel-apagada" data-apagada />
          </div>
        </div>
        {reverso && (
          <>
            <div className="tel-cara tel-reverso" role="img" aria-label={etiquetaReverso}>
              <div className="tel-pantalla tel-pantalla-agenda">
                <BarraEstado hora={hora} oscura />
                <i className="tel-camara" />
                {reverso}
                <i className="tel-reflejo" />
              </div>
            </div>
            <i className="tel-canto tel-canto-izq" />
            <i className="tel-canto tel-canto-der" />
          </>
        )}
      </div>
    </div>
  );
}

function BarraEstado({ hora, oscura = false }: { hora: string; oscura?: boolean }) {
  return (
    <div className={oscura ? "tel-estado tel-estado-oscura" : "tel-estado"}>
      <span className="tel-hora" data-hora-tel>
        {hora}
      </span>
      <span className="tel-senales">
        <Signal aria-hidden="true" strokeWidth={2.4} />
        <Wifi aria-hidden="true" strokeWidth={2.4} />
        <BatteryFull aria-hidden="true" strokeWidth={2} />
      </span>
    </div>
  );
}
