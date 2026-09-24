import { AnimatedButton } from "@/components/ui/animated-button";
import { CylinderCarousel } from "@/components/ui/cylinder-carousel";
import { ENLACE_DEMO_CLINICA, NOTIFICACIONES } from "./datos";
import { ANUNCIOS_TAMBOR } from "./EscenaNoche";
import { Notificacion } from "./Notificacion";

/** Vuelve a ser de noche: los mensajes siguen llegando. La historia empieza otra vez hoy. */
export function EscenaCierre() {
  return (
    <section className="cap cap-cierre" id="cierre" data-tema="noche" aria-labelledby="titulo-cierre">
      <div className="escena escena-cierre" data-escena="cierre">
        <CylinderCarousel
          id="cierre"
          className="tambor-cierre"
          etiqueta="Mensajes que llegan a una clínica a toda hora"
          anuncios={ANUNCIOS_TAMBOR}
          interactivo={false}
          autoVelocidad={-5}
        >
          {NOTIFICACIONES.map((n, i) => (
            <Notificacion key={n.hora} datos={n} tono={(i + 2) % 5} />
          ))}
        </CylinderCarousel>
        <div className="cierre-frase" data-cierre-frase>
          <h2 id="titulo-cierre" className="titular-2">
            Esta noche alguien va a escribirle a tu clínica.
          </h2>
          <p className="entrada">Te enseñamos el asistente con los servicios y precios de tu clínica.</p>
          <AnimatedButton href={ENLACE_DEMO_CLINICA}>Ver la demo por WhatsApp</AnimatedButton>
        </div>
      </div>
    </section>
  );
}
