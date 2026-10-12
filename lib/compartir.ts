import type { Metadata } from "next";

/**
 * Lo que comparten todas las páginas en la tarjeta al pegar el enlace (Open Graph). Next junta la metadata de
 * cada página con la del layout sin entrar a los campos: si una página define su `openGraph`, borra el del
 * layout completo (generate-metadata.md, «Merging»). Por eso el idioma, el nombre del sitio y la imagen viven
 * aquí y los usan el layout y las guías.
 */
export const COMPARTIR = {
  locale: "es_MX",
  siteName: "YaContesto",
  imagenes: [
    {
      // La imagen al compartir del kit del logo (enlace-compartido-og-oscuro, 7-oct-2026).
      url: "/og.png",
      type: "image/png",
      width: 1200,
      height: 630,
      alt: "YaContesto: el globo de chat con palomita y el nombre, en crema sobre fondo negro.",
    },
  ],
};

type Tarjeta = { titulo: string; descripcion: string; ruta: string } & (
  | { tipo: "website" }
  | { tipo: "article"; publicada: string; actualizada: string }
);

/** La tarjeta al compartir de una página aparte (las guías): Open Graph y la de X, con su propio título. */
export function tarjetaDe(t: Tarjeta): Pick<Metadata, "openGraph" | "twitter"> {
  const comun = {
    locale: COMPARTIR.locale,
    siteName: COMPARTIR.siteName,
    url: t.ruta,
    title: t.titulo,
    description: t.descripcion,
    images: COMPARTIR.imagenes,
  };
  return {
    openGraph:
      t.tipo === "article"
        ? { ...comun, type: "article", publishedTime: t.publicada, modifiedTime: t.actualizada, authors: ["YaContesto"] }
        : { ...comun, type: "website" },
    twitter: { card: "summary_large_image", title: t.titulo, description: t.descripcion, images: [COMPARTIR.imagenes[0].url] },
  };
}
