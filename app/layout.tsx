import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Patrick_Hand_SC } from "next/font/google";
import { COMPARTIR } from "@/lib/compartir";
import "./globals.css";

// Identidad nueva (rebranding del 5-oct-2026): Bricolage Grotesque en titulares, con su tamaño óptico
// (en grande se vuelve de cartel), e Instrument Sans en el texto. Patrick Hand SC solo para las notas a
// mano de Moli, como en su hoja de personaje. Se precarga solo el titular, que es el LCP.
const titular = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-titular",
  display: "swap",
});
const texto = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-texto",
  display: "swap",
  preload: false,
});
const mano = Patrick_Hand_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mano",
  display: "swap",
  preload: false,
});

// Título (≤ 60) y descripción (≤ 160) para que Google no los corte; aprobados por Diego el 12-oct-2026 (SEO-1).
// scripts/seo.mjs revisa los largos.
const descripcion =
  "Instalamos una recepcionista con IA en el WhatsApp de tu clínica dental: contesta a cualquier hora, revisa tu agenda y deja la cita. Lista en 7 días.";

export const metadata: Metadata = {
  metadataBase: new URL("https://yacontesto.com"),
  title: "YaContesto: recepcionista con IA en WhatsApp para dentistas",
  description: descripcion,
  alternates: { canonical: "/" },
  // Search Console, propiedad «Prefijo de URL» https://yacontesto.com/ (cuenta de Diego, 12-oct-2026).
  // La etiqueta tiene que quedarse siempre: si se quita, Google deja de dar la propiedad por verificada.
  verification: { google: "N9BAlc6sneZmJIcs8uKmM3NoGAJZmZOTkguZW7Uh1xY" },
  applicationName: "YaContesto",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: COMPARTIR.locale,
    url: "/",
    siteName: COMPARTIR.siteName,
    title: "Tu WhatsApp contesta solo, a las 11 p. m.",
    description:
      "Una recepcionista con inteligencia artificial para tu clínica dental: contesta, revisa tu agenda y deja la cita en tu calendario.",
    images: COMPARTIR.imagenes,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tu WhatsApp contesta solo, a las 11 p. m.",
    description: "Una recepcionista con inteligencia artificial para tu clínica dental.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin viewportFit "cover", env(safe-area-inset-*) vale 0 y la pastilla no libra la barra de inicio.
  viewportFit: "cover",
  themeColor: "#0E100F",
  colorScheme: "dark",
};

// Antes de pintar: con movimiento permitido, la historia se cuenta con scroll («cine»).
// Con prefers-reduced-motion, sin JavaScript, con ?movimiento=0 o en pantallas de menos de 500 px
// de alto (celular acostado, zoom de 200 %), se ve quieta y completa.
// Si en 20 s no llegó el JavaScript que la cuenta (red rota, error), se vuelve a la versión quieta.
// Con «cine» va «aplaza»: la transcripción para lectores de pantalla se calcula después de abrir
// (components/consultorio/noche/aplazados.ts).
const arranque = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search).get('movimiento')==='0';if(q||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(max-height: 499px)').matches)return;d.classList.add('cine','aplaza');setTimeout(function(){if(!window.__directorVivo)d.classList.remove('cine','aplaza')},20000)}catch(e){d.classList.remove('cine','aplaza')}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: el guion de arranque agrega la clase «cine» antes de hidratar.
    <html lang="es-MX" className={`${titular.variable} ${texto.variable} ${mano.variable}`} suppressHydrationWarning>
      <head>
        {/* En línea y en el <head>: corre antes de pintar. */}
        <script dangerouslySetInnerHTML={{ __html: arranque }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
