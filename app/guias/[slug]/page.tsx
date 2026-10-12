import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/consultorio/Logo";
import { CUERPOS } from "@/components/guias/cuerpos";
import { tarjetaDe } from "@/lib/compartir";
import { datosDeGuia } from "@/lib/datos-estructurados";
import { GUIAS, fechaLegible, guiaPorSlug, rutaDeGuia, type SlugGuia } from "@/lib/guias";

type Props = { params: Promise<{ slug: string }> };

// Exportación estática: solo existen las guías de la lista; cualquier otra dirección es la 404
// (static-exports.md: sin `dynamicParams = false` la ruta dinámica no se puede exportar).
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIAS.map((guia) => ({ slug: guia.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guia = guiaPorSlug((await params).slug);
  if (!guia) notFound();
  const ruta = rutaDeGuia(guia.slug);
  return {
    title: guia.tituloCorto,
    description: guia.descripcion,
    alternates: { canonical: ruta },
    ...tarjetaDe({
      tipo: "article",
      titulo: guia.tituloCorto,
      descripcion: guia.descripcion,
      ruta,
      publicada: guia.publicada,
      actualizada: guia.actualizada,
    }),
  };
}

/**
 * Una guía (SEO-2): el texto largo con el estilo del aviso de privacidad, su ficha Article y, arriba, el camino
 * de regreso al índice. `.pagina` le da fondo a la marca desde el principio (sin la escena no hay noche que
 * dejar ver).
 */
export default async function PaginaGuia({ params }: Props) {
  const guia = guiaPorSlug((await params).slug);
  if (!guia) notFound();
  const Cuerpo = CUERPOS[guia.slug as SlugGuia];
  return (
    <div className="pagina">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: datosDeGuia(guia) }} />
      <header className="cabecera">
        <a className="marca" href="/" aria-label="YaContesto, inicio">
          <Logo />
          YaContesto
        </a>
      </header>
      <main className="aviso guia">
        <nav className="guia-ruta" aria-label="Ruta de navegación">
          <a href="/guias/">Guías</a>
        </nav>
        <article>
          <h1>{guia.titulo}</h1>
          <p className="aviso-fecha">
            Por YaContesto · Actualizada: <time dateTime={guia.actualizada}>{fechaLegible(guia.actualizada)}</time>
          </p>
          <Cuerpo />
        </article>
      </main>
    </div>
  );
}
