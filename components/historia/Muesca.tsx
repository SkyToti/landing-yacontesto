import { NotchNavbar } from "@/components/ui/notch-navbar";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Isotipo } from "./Isotipo";
import { ENLACE_DEMO } from "./datos";

/**
 * La barra: el isotipo con el nombre, el reloj de la historia en la muesca y la acción.
 * El reloj lo escribe el Director con el scroll; para los lectores de pantalla es decorativo.
 */
export function Muesca() {
  return (
    <NotchNavbar
      data-muesca
      aria-label="YaContesto"
      izquierda={
        <a className="marca" href="#noche">
          <Isotipo tamano={28} />
          <span className="marca-nombre">YaContesto</span>
          <span className="solo-lectores">, inicio</span>
        </a>
      }
      muesca={
        <div className="reloj" aria-hidden="true">
          <span className="reloj-dia" data-reloj-dia>
            mié
          </span>
          <span className="reloj-hora cifra" data-reloj-hora>
            23:47
          </span>
        </div>
      }
      derecha={
        <>
          <nav className="muesca-nav" aria-label="Secciones">
            <a href="#precio">Precio</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <AnimatedButton href={ENLACE_DEMO} tamano="chico" icono={false}>
            Ver la demo
          </AnimatedButton>
        </>
      }
    />
  );
}
