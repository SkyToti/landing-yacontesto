import { AnimatedButton } from "@/components/ui/animated-button";
import { CilindroCierre } from "./CilindroCierre";
import { ENLACE_DEMO_CLINICA } from "./datos";

/** Vuelve a ser de noche: los mensajes siguen llegando. La historia empieza otra vez hoy. */
export function EscenaCierre() {
  return (
    <section className="cap cap-cierre" id="cierre" data-tema="noche" aria-labelledby="titulo-cierre">
      <div className="escena escena-cierre" data-escena="cierre">
        <CilindroCierre />
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
