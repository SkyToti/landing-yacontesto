import { ArrowLeft, Camera, EllipsisVertical, Mic, Paperclip, Phone, Smile, Video } from "lucide-react";
import type { Burbuja } from "./datos";

/**
 * La conversación como la ve el paciente en su WhatsApp. El look de la app vive solo aquí
 * dentro, sin su logotipo; los iconos son genéricos. No hay «escribiendo…» ni «revisando tu
 * agenda…»: el asistente no los manda.
 */
export function Chat({
  burbujas,
  prefijo,
  pie,
}: {
  burbujas: (Burbuja & { quien?: string })[];
  prefijo: string;
  pie?: string;
}) {
  return (
    <div className="wa">
      <div className="wa-cabeza">
        <ArrowLeft aria-hidden="true" strokeWidth={2} />
        <span className="wa-avatar" aria-hidden="true">
          CD
        </span>
        <span className="wa-quien">
          <b>Clínica Dental</b>
          <span>Cuenta de empresa</span>
        </span>
        <span className="wa-acciones">
          <Video aria-hidden="true" strokeWidth={1.9} />
          <Phone aria-hidden="true" strokeWidth={1.9} />
          <EllipsisVertical aria-hidden="true" strokeWidth={1.9} />
        </span>
      </div>
      <div className="wa-chat" data-chat>
        <span className="wa-fecha">{pie ?? "Hoy"}</span>
        {burbujas.map((b, i) => {
          const nuevaRacha = i === 0 || burbujas[i - 1].de !== b.de;
          return (
            <div key={i} className={`b-fila ${b.de === "paciente" ? "pac" : "cli"}${nuevaRacha ? " cola" : ""}`} data-b={`${prefijo}${i + 1}`}>
              <div className="b">
                <span className="b-texto">{b.texto}</span>
                <span className="t">
                  {b.hora}
                  {b.de === "paciente" && <Palomitas />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="wa-barra">
        <span className="wa-campo">
          <Smile aria-hidden="true" strokeWidth={1.8} />
          <span>Mensaje</span>
          <Paperclip aria-hidden="true" strokeWidth={1.8} />
          <Camera aria-hidden="true" strokeWidth={1.8} />
        </span>
        <span className="wa-mic">
          <Mic aria-hidden="true" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

/** Doble palomita gris («entregado»): el asistente no marca como leído, así que nunca se ponen azules. */
export function Palomitas() {
  return (
    <svg className="palomitas" viewBox="0 0 17 12" aria-hidden="true">
      <path d="m1 7 3 3 5.5-6.5" />
      <path d="m7 7 3 3 5.5-6.5" />
    </svg>
  );
}
