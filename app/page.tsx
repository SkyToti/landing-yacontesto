import { DirectorNoche } from "@/components/consultorio/noche/DirectorNoche";
import { EscenaNoche } from "@/components/consultorio/noche/EscenaNoche";
import { Pastilla } from "@/components/consultorio/Pastilla";
import { Logo } from "@/components/consultorio/Logo";
import { Despues, Pie } from "@/components/consultorio/despues/Despues";
import { VidaCierre } from "@/components/consultorio/despues/VidaCierre";

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
 * «Un día en tu consultorio», rediseño con Moli (R-1, rama r1-moli). Paso 6: el día completo, de las 23:47 a
 * las 19:00, y después, sobre la noche, la página normal: instalación, precio, preguntas, el cierre con Moli
 * y el pie. Guion: proyecto/ventas/rebranding/GUION-LANDING.md.
 */
export default function Inicio() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
      <header className="cabecera">
        <a className="marca" href="#noche" aria-label="YaContesto, inicio">
          <Logo />
          YaContesto
        </a>
      </header>
      <main>
        <EscenaNoche />
        <Despues />
      </main>
      <Pie />
      <Pastilla />
      <DirectorNoche />
      <VidaCierre />
    </>
  );
}
