import { PRECIO } from "@/components/historia/datos";
import { DirectorNoche } from "@/components/consultorio/noche/DirectorNoche";
import { EscenaNoche } from "@/components/consultorio/noche/EscenaNoche";
import { ENLACE_ESCRIBENOS, Pastilla } from "@/components/consultorio/Pastilla";

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

const pesos = (n: number) => `$${n.toLocaleString("es-MX")}`;

/**
 * «Un día en tu consultorio», rediseño con Moli (R-1, rama r1-moli). Paso 4: están construidas
 * las 23:47, el arrancón del calendario, las 09:00, el recorrido del mostrador, las 11:20, el viaje al
 * consultorio y las 16:05; lo que sigue del día está anunciado abajo, en obra.
 * Guion: proyecto/ventas/rebranding/GUION-LANDING.md.
 */
export default function Inicio() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
      <header className="cabecera">
        <a className="marca" href="#noche" aria-label="YaContesto, inicio">
          YaContesto
        </a>
      </header>
      <main>
        <EscenaNoche />
        <section className="en-obra" id="precio" aria-labelledby="titulo-obra">
          <p className="ceja">Prototipo · paso 4 de varios</p>
          <h2 id="titulo-obra" className="titulo-paso">
            El día sigue: 19:00.
          </h2>
          <p className="texto-paso">
            Aquí van la última escena, el precio y las preguntas. Por ahora están construidas la de las 23:47, la de las
            09:00, la de las 11:20 y la de las 16:05.
          </p>
          <dl className="precio-corto">
            <div>
              <dt>Precio fundador</dt>
              <dd>
                {pesos(PRECIO.instalacionFundador)} de instalación + {pesos(PRECIO.escalones.base)} al mes, hasta{" "}
                {PRECIO.escalones.hasta} pacientes atendidos.
              </dd>
            </div>
            <div>
              <dt>Precio de lista</dt>
              <dd>
                {pesos(PRECIO.instalacionLista)} + desde {pesos(PRECIO.mensualidadLista)} al mes.
              </dd>
            </div>
          </dl>
          <a className="boton-obra" href={ENLACE_ESCRIBENOS} target="_blank" rel="noopener">
            Escríbenos por WhatsApp
          </a>
        </section>
      </main>
      <Pastilla />
      <DirectorNoche />
    </>
  );
}
