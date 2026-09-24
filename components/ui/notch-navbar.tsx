import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Notch Navbar de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su geometría: dos barras de 40 px con doble línea fina, y una muesca de 64 px en
 * tres rebanadas (esquina curva, centro flexible, esquina curva) con el mismo trazo doble.
 * Cambia el contenido: en lugar de enlaces a los lados y el logo en la muesca, recibe tres
 * ranuras (izquierda, muesca y derecha). Sin selector de tema ni menú: aquí el tema lo pone la
 * hora de la historia. Los colores salen de variables (--muesca-*), que el Director funde con
 * el scroll. Es un componente de servidor: no hidrata nada.
 */
export function NotchNavbar({
  izquierda,
  muesca,
  derecha,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { izquierda: ReactNode; muesca: ReactNode; derecha: ReactNode }) {
  return (
    <header className={cn("muesca", className)} {...props}>
      <div className="muesca-barra muesca-barra-izq">
        <svg className="muesca-lineas" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" className="dos" />
        </svg>
        {izquierda}
      </div>

      <div className="muesca-centro">
        <div className="muesca-esquina">
          <svg viewBox="0 0 50 64" preserveAspectRatio="none" aria-hidden="true">
            <path className="muesca-relleno" d="M0 0H50V64C25 64 25 40 0 40Z" />
            <path className="muesca-trazo" d="M0 39.5C25 39.5 25 63.5 50 63.5" />
            <path className="muesca-trazo dos" d="M0 36.5C25 36.5 25 60.5 50 60.5" />
          </svg>
        </div>
        <div className="muesca-medio">
          <svg className="muesca-lineas" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" y1="63.5" x2="100%" y2="63.5" />
            <line x1="0" y1="60.5" x2="100%" y2="60.5" className="dos" />
          </svg>
          {muesca}
        </div>
        <div className="muesca-esquina">
          <svg viewBox="0 0 50 64" preserveAspectRatio="none" aria-hidden="true">
            <path className="muesca-relleno" d="M0 0H50V40C25 40 25 64 0 64Z" />
            <path className="muesca-trazo" d="M0 63.5C25 63.5 25 39.5 50 39.5" />
            <path className="muesca-trazo dos" d="M0 60.5C25 60.5 25 36.5 50 36.5" />
          </svg>
        </div>
      </div>

      <div className="muesca-barra muesca-barra-der">
        <svg className="muesca-lineas" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" className="dos" />
        </svg>
        {derecha}
      </div>
    </header>
  );
}

export default NotchNavbar;
