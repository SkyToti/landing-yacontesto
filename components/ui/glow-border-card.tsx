import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Glow Border Card de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su efecto: un borde con degradado cónico de hasta diez colores, desenfocado
 * detrás de la tarjeta, que gira con la propiedad registrada --glow-angle.
 * Cambios: el giro no es un bucle infinito; lo mueve quien la usa (aquí, el control del precio:
 * la luz recorre la tarjeta mientras el visitante arrastra) con una transición suave. Superficie
 * blanca sólida en lugar de vidrio, colores del verde pino y el ámbar de la hora, y es de
 * servidor: no hidrata nada.
 */
export interface GlowBorderCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  borderRadius?: string;
  gradientColors?: string[];
  borderWidth?: string;
  blurAmount?: string;
  inset?: string;
}

const PINO = ["#0c3d22", "#91d5b8", "#f2b84b", "#0c3d22", "#2b7a52", "#91d5b8", "#0c3d22", "#f2b84b", "#91d5b8", "#0c3d22"];

export function GlowBorderCard({
  children,
  className,
  borderRadius = "14px",
  gradientColors = PINO,
  borderWidth = "14px",
  blurAmount = "20px",
  inset = "-10px",
  style,
  ...props
}: GlowBorderCardProps) {
  const colores: Record<string, string> = {};
  for (let i = 0; i < 10; i++) colores[`--glow-color-${i + 1}`] = gradientColors[i % gradientColors.length];

  return (
    <div className={cn("brillo-tarjeta", className)} style={{ borderRadius, ...colores, ...style } as CSSProperties} {...props}>
      <div className="brillo-borde glow-conic" aria-hidden="true" style={{ inset, borderWidth, filter: `blur(${blurAmount})` }} />
      <div className="brillo-contenido">{children}</div>
    </div>
  );
}

export default GlowBorderCard;
