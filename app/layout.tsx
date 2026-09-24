import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Sofia_Sans, Sofia_Sans_Condensed, Sofia_Sans_Extra_Condensed } from "next/font/google";
import "./globals.css";

// Sofia Sans (Latinotype) en tres anchos del mismo esqueleto: texto, titulares y horas.
// Pesos estáticos (no el archivo variable): se dibujan igual en todos los motores y solo se baja
// lo que se usa. Se precarga solo el titular, que es el LCP; lo demás entra con swap.
const texto = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-texto",
  display: "swap",
  preload: false,
});
const titular = Sofia_Sans_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-titular",
  display: "swap",
});
const hora = Sofia_Sans_Extra_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-hora",
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
  themeColor: "#0C3D22",
  colorScheme: "dark light",
};

// Antes de pintar: con movimiento permitido, la historia se cuenta con scroll («cine»).
// Con prefers-reduced-motion, sin JavaScript o con ?movimiento=0, se ve quieta y completa.
// Si en 20 s no llegó el JavaScript que la cuenta (red rota, error), se vuelve a la versión quieta.
const arranque = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search).get('movimiento')==='0';if(q||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('cine');setTimeout(function(){if(!window.__directorVivo)d.classList.remove('cine')},20000)}catch(e){d.classList.remove('cine')}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: el guion de arranque agrega la clase «cine» antes de hidratar.
    <html lang="es-MX" className={`${texto.variable} ${titular.variable} ${hora.variable}`} suppressHydrationWarning>
      <head>
        {/* En línea y en el <head>: corre antes de pintar (next/script lo encolaba para después). */}
        <script dangerouslySetInnerHTML={{ __html: arranque }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
