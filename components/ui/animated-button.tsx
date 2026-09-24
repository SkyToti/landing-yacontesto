import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animated Button de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conservan sus dos brillos: el que cruza el texto (máscara con degradado a -75°) y el que
 * recorre el borde (máscara con `mask-composite`), y la respuesta con resorte al pasar el cursor
 * y al presionar. Cambia el motor: en lugar de framer-motion en bucle infinito, CSS que corre una
 * vez al cargar y otra al pasar el cursor (el sistema pide «el brillo cruza una vez»). Así el botón
 * de la portada no espera a ningún JavaScript. Es un enlace: todas las acciones abren WhatsApp.
 */
export function AnimatedButton({
  href,
  children,
  className,
  icono = true,
  tamano = "grande",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  icono?: boolean;
  tamano?: "grande" | "chico";
}) {
  return (
    <a
      className={cn("boton", tamano === "chico" && "boton-chico", className)}
      href={href}
      target="_blank"
      rel="noopener"
    >
      <span className="boton-borde" aria-hidden="true" />
      <span className="boton-texto">
        {icono && <MessageCircle aria-hidden="true" strokeWidth={1.75} />}
        {children}
      </span>
      <span className="solo-lectores"> (se abre WhatsApp)</span>
    </a>
  );
}

export default AnimatedButton;
