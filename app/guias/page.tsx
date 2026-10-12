import type { Metadata } from "next";
import { Logo } from "@/components/consultorio/Logo";
import { tarjetaDe } from "@/lib/compartir";
import { GUIAS, fechaLegible, rutaDeGuia } from "@/lib/guias";

const titulo = "Guías para clínicas dentales | YaContesto";
const descripcion =
  "Guías para dentistas en México sobre WhatsApp, citas y recepcionistas con IA: qué hace cada cosa, qué no y cuánto cuesta, con fuentes y fechas.";

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  alternates: { canonical: "/guias/" },
  ...tarjetaDe({ tipo: "website", titulo, descripcion, ruta: "/guias/" }),
};

/** El índice de las guías (SEO-2): sale de lib/guias.ts, la más reciente primero. */
export default function Guias() {
  const guias = [...GUIAS].sort((a, b) => b.actualizada.localeCompare(a.actualizada));
  return (
    <div className="pagina">
      <header className="cabecera">
        <a className="marca" href="/" aria-label="YaContesto, inicio">
          <Logo />
          YaContesto
        </a>
      </header>
      <main className="aviso guia">
        <h1>Guías para clínicas dentales</h1>
        <p className="guia-entrada">
          Lo que nos preguntan los dentistas sobre WhatsApp, citas y recepcionistas con IA, contestado con calma: qué hace
          cada cosa, qué no y cuánto cuesta. Con fuentes y con su fecha.
        </p>
        <ul className="guias-lista">
          {guias.map((guia) => (
            <li key={guia.slug}>
              <h2>
                <a href={rutaDeGuia(guia.slug)}>{guia.titulo}</a>
              </h2>
              <p>{guia.descripcion}</p>
              <p className="aviso-fecha">
                Actualizada: <time dateTime={guia.actualizada}>{fechaLegible(guia.actualizada)}</time>
              </p>
            </li>
          ))}
        </ul>
        <p>
          <a className="boton-obra" href="/">
            Volver al inicio
          </a>
        </p>
      </main>
    </div>
  );
}
