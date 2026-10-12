import { PIE } from "@/components/consultorio/despues/textos";
import { PRECIO } from "@/components/historia/datos";
import { rutaDeGuia, type Guia } from "@/lib/guias";

/**
 * La ficha para buscadores (JSON-LD) de la portada, SEO-1 (12-oct-2026). Un solo `@graph`:
 * - WebSite: con ella Google elige el nombre del sitio que pone arriba del resultado.
 * - Organization: YaContesto como empresa (logo, correo, número, ciudad y redes). Decisión de Diego: en los
 *   datos va la empresa, no su nombre (el aviso de privacidad sí lo lleva, porque la ley lo pide).
 * - Service: lo que vendemos, con YaContesto como proveedor y las ofertas del precio fundador.
 * Todo sale de las constantes que ya usa la página (`PIE` y `PRECIO`): si cambia el precio o el número, la
 * ficha cambia sola y no puede contradecir lo que se ve. scripts/seo.mjs revisa que los precios cuadren.
 *
 * Cada guía (SEO-2) lleva su propia ficha: un Article con YaContesto como autor y editor, por el `@id` de la
 * Organization. La Organization y el WebSite van completos también en la guía, porque Google y los
 * validadores leen cada página por separado: con el puro `@id` no sabrían el nombre del autor.
 */
const SITIO = "https://yacontesto.com/";
const ID = { sitio: `${SITIO}#sitio`, empresa: `${SITIO}#empresa`, servicio: `${SITIO}#servicio` };
const [localidad, region] = PIE.ciudad.split(", ");
const MXN = "MXN";
const porMes = (precio: number) => ({
  "@type": "UnitPriceSpecification",
  price: precio,
  priceCurrency: MXN,
  referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
});
const { base, hasta, segundo, hastaSegundo, porPacienteExtra } = PRECIO.escalones;

const SITIO_WEB = {
  "@type": "WebSite",
  "@id": ID.sitio,
  name: "YaContesto",
  alternateName: "Ya Contesto",
  url: SITIO,
  inLanguage: "es-MX",
  publisher: { "@id": ID.empresa },
};

const EMPRESA = {
  "@type": "Organization",
  "@id": ID.empresa,
  name: "YaContesto",
  alternateName: "Ya Contesto",
  url: SITIO,
  // El logo solo del kit (7-oct-2026), versión principal con su fondo de tinta: se distingue sobre blanco,
  // que es como lo muestra Google (mínimo 112 px).
  logo: { "@type": "ImageObject", url: `${SITIO}logo-512.png`, width: 512, height: 512 },
  description: PIE.queEs,
  email: PIE.correo,
  telephone: PIE.telefono,
  // Solo la ciudad, sin calle.
  address: { "@type": "PostalAddress", addressLocality: localidad, addressRegion: region, addressCountry: "MX" },
  // Los perfiles de YaContesto: así los buscadores los ligan con el sitio.
  sameAs: PIE.redes.map((red) => red.url),
};

export const DATOS_ESTRUCTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    SITIO_WEB,
    EMPRESA,
    {
      "@type": "Service",
      "@id": ID.servicio,
      name: "Recepcionista con IA para el WhatsApp de clínicas dentales",
      serviceType: "Recepcionista con inteligencia artificial para WhatsApp",
      description:
        "Asistente con inteligencia artificial para el WhatsApp de clínicas dentales: contesta al instante, revisa la agenda y deja la cita en el calendario de la clínica.",
      url: SITIO,
      provider: { "@id": ID.empresa },
      areaServed: { "@type": "Country", name: "México" },
      offers: [
        {
          "@type": "Offer",
          name: "Instalación, precio fundador",
          price: PRECIO.instalacionFundador,
          priceCurrency: MXN,
        },
        {
          "@type": "Offer",
          name: `Mensualidad, precio fundador: hasta ${hasta} pacientes atendidos al mes`,
          price: base,
          priceCurrency: MXN,
          priceSpecification: porMes(base),
        },
        {
          "@type": "Offer",
          name: `Mensualidad, precio fundador: hasta ${hastaSegundo} pacientes atendidos al mes`,
          description: `Arriba de ${hastaSegundo} pacientes, ${porPacienteExtra} pesos por cada paciente extra.`,
          price: segundo,
          priceCurrency: MXN,
          priceSpecification: porMes(segundo),
        },
      ],
    },
  ],
};

/** El JSON listo para el `<script type="application/ld+json">`, con `<` escapado como pide la guía de Next. */
const aJsonLd = (datos: object) => JSON.stringify(datos).replace(/</g, "\\u003c");

export const DATOS_ESTRUCTURADOS_JSON = aJsonLd(DATOS_ESTRUCTURADOS);

/**
 * La ficha de una guía. Sin `image`: Google pide imágenes del artículo, no logotipos (Datos estructurados de
 * artículos, act. 12-sep-2026), y la imagen al compartir es el logo. Las fechas van como AAAA-MM-DD.
 */
export function datosDeGuia(guia: Guia) {
  const url = `${SITIO}${rutaDeGuia(guia.slug).slice(1)}`;
  return aJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      SITIO_WEB,
      EMPRESA,
      {
        "@type": "Article",
        "@id": `${url}#guia`,
        headline: guia.titulo,
        description: guia.descripcion,
        url,
        mainEntityOfPage: url,
        inLanguage: "es-MX",
        datePublished: guia.publicada,
        dateModified: guia.actualizada,
        author: { "@id": ID.empresa },
        publisher: { "@id": ID.empresa },
        isPartOf: { "@id": ID.sitio },
      },
    ],
  });
}
