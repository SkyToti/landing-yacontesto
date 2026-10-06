import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Patrick_Hand_SC } from "next/font/google";
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

const descripcion =
  "Instalamos un asistente con inteligencia artificial en el WhatsApp de tu clínica dental: contesta al instante a cualquier hora, revisa tu agenda y deja la cita en tu Google Calendar. Listo en 7 días, con garantía de 14 días.";

export const metadata: Metadata = {
  metadataBase: new URL("https://yacontesto.com"),
  title: "YaContesto | Recepcionista con IA para el WhatsApp de tu clínica dental",
  description: descripcion,
  alternates: { canonical: "/" },
  applicationName: "YaContesto",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "YaContesto",
    title: "Tu WhatsApp contesta solo, a las 11 p. m.",
    description:
      "Una recepcionista con inteligencia artificial para tu clínica dental: contesta, revisa tu agenda y deja la cita en tu calendario.",
    images: [
      {
        url: "/og.jpg",
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "Tu WhatsApp contesta solo, a las 11 p. m.: mensajes de pacientes que llegan de noche y en fin de semana.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tu WhatsApp contesta solo, a las 11 p. m.",
    description: "Una recepcionista con inteligencia artificial para tu clínica dental.",
    images: ["/og.jpg"],
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
const arranque = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search).get('movimiento')==='0';if(q||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(max-height: 499px)').matches)return;d.classList.add('cine');setTimeout(function(){if(!window.__directorVivo)d.classList.remove('cine')},20000)}catch(e){d.classList.remove('cine')}})();`;

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
