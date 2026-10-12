import { DirectorNoche } from "@/components/consultorio/noche/DirectorNoche";
import { EscenaNoche } from "@/components/consultorio/noche/EscenaNoche";
import { Pastilla } from "@/components/consultorio/Pastilla";
import { Logo } from "@/components/consultorio/Logo";
import { Despues, Pie } from "@/components/consultorio/despues/Despues";
import { VidaCierre } from "@/components/consultorio/despues/VidaCierre";
import { DATOS_ESTRUCTURADOS_JSON } from "@/lib/datos-estructurados";

/**
 * «Un día en tu consultorio», rediseño con Moli (R-1, rama r1-moli). Paso 6: el día completo, de las 23:47 a
 * las 19:00, y después, sobre la noche, la página normal: instalación, precio, preguntas, el cierre con Moli
 * y el pie. Guion: proyecto/ventas/rebranding/GUION-LANDING.md.
 */
export default function Inicio() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: DATOS_ESTRUCTURADOS_JSON }} />
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
