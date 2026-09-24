import { Cielo } from "@/components/historia/Cielo";
import { Director } from "@/components/historia/Director";
import { EscenaAmanece } from "@/components/historia/EscenaAmanece";
import { EscenaCierre } from "@/components/historia/EscenaCierre";
import { EscenaDia } from "@/components/historia/EscenaDia";
import { EscenaEquipo } from "@/components/historia/EscenaEquipo";
import { EscenaInstala } from "@/components/historia/EscenaInstala";
import { EscenaNoche } from "@/components/historia/EscenaNoche";
import { Muesca } from "@/components/historia/Muesca";
import { Pie } from "@/components/historia/Pie";
import { SeccionPrecio } from "@/components/historia/SeccionPrecio";
import { SeccionPreguntas } from "@/components/historia/SeccionPreguntas";

const datosEstructurados = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "YaContesto",
  serviceType: "Recepcionista con inteligencia artificial para WhatsApp",
  areaServed: { "@type": "Country", name: "México" },
  url: "https://yacontesto.com/",
  provider: { "@type": "Person", name: "Diego Benítez", email: "diego@yacontesto.com" },
  description:
    "Asistente con inteligencia artificial para el WhatsApp de clínicas dentales: contesta al instante, revisa la agenda y deja la cita en el calendario de la clínica.",
};

/**
 * «Un día en tu consultorio»: el scroll es el reloj de un día. Cada escena es una hora y una
 * capacidad real del asistente. Sin JavaScript o con movimiento reducido, todo se ve quieto y
 * completo; con movimiento, el Director (GSAP) lo cuenta con el scroll.
 */
export default function Inicio() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
      <a className="saltar" href="#precio">
        Saltar la historia e ir al precio
      </a>
      <Cielo />
      <Muesca />
      <main>
        <EscenaNoche />
        <EscenaAmanece />
        <EscenaEquipo />
        <EscenaDia />
        <EscenaInstala />
        <SeccionPrecio />
        <SeccionPreguntas />
        <EscenaCierre />
      </main>
      <Pie />
      <Director />
    </>
  );
}
