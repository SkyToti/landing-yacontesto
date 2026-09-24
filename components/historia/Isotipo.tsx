/**
 * El isotipo: un globo de texto con la palomita de «resuelto». La cola sale abajo a la
 * derecha, como un mensaje que tú envías: es la clínica la que contesta.
 */
export function Isotipo({ tamano = 30, className }: { tamano?: number; className?: string }) {
  return (
    <svg className={className ? `iso ${className}` : "iso"} width={tamano} height={tamano} viewBox="0 0 48 48" aria-hidden="true">
      <path className="iso-globo" d="M14 6H34A10 10 0 0 1 44 16V42.6A1 1 0 0 1 42.4 43.4L33.2 36H14A10 10 0 0 1 4 26V16A10 10 0 0 1 14 6Z" />
      <path className="iso-palomita" d="M14.6 21.4 20.6 27.4 33.4 14.6" />
    </svg>
  );
}
