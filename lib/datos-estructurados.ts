import { PIE } from "@/components/consultorio/despues/textos";
import { PRECIO } from "@/components/historia/datos";

/**
 * La ficha para buscadores (JSON-LD) de la portada, SEO-1 (12-oct-2026). Un solo `@graph`:
 * - WebSite: con ella Google elige el nombre del sitio que pone arriba del resultado.
 * - Organization: YaContesto como empresa (logo, correo, número, ciudad y redes). Decisión de Diego: en los
 *   datos va la empresa, no su nombre (el aviso de privacidad sí lo lleva, porque la ley lo pide).
 * - Service: lo que vendemos, con YaContesto como proveedor y las ofertas del precio fundador.
 * Todo sale de las constantes que ya usa la página (`PIE` y `PRECIO`): si cambia el precio o el número, la
 * ficha cambia sola y no puede contradecir lo que se ve. scripts/seo.mjs revisa que los precios cuadren.
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

export const DATOS_ESTRUCTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": ID.sitio,
      name: "YaContesto",
      alternateName: "Ya Contesto",
      url: SITIO,
      inLanguage: "es-MX",
      publisher: { "@id": ID.empresa },
    },
    {
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
    },
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
export const DATOS_ESTRUCTURADOS_JSON = JSON.stringify(DATOS_ESTRUCTURADOS).replace(/</g, "\\u003c");
