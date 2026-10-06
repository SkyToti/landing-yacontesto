import { enlaceWhatsApp } from "@/components/historia/datos";

/** El texto que llega ya escrito al WhatsApp de ventas (decisión de Diego, 5-oct-2026). Contesta Diego. */
export const ENLACE_ESCRIBENOS = enlaceWhatsApp("Hola, vi YaContesto y quiero saber más para mi clínica");

/**
 * La pastilla de abajo, como el menú de cipharvin.ro: siempre en el mismo lugar para el pulgar.
 * Cero ventanas emergentes y cero burbujas flotantes (guion, sección 1).
 */
export function Pastilla() {
  return (
    <nav className="pastilla" aria-label="Contacto">
      <a className="p-precio" href="#precio">
        Precio
      </a>
      <a className="p-whatsapp" href={ENLACE_ESCRIBENOS} target="_blank" rel="noopener">
        Escríbenos por WhatsApp
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" />
        </svg>
      </a>
    </nav>
  );
}
