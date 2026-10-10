import type { Metadata } from "next";
import Link from "next/link";
import { PIE } from "@/components/consultorio/despues/textos";
import { Logo } from "@/components/consultorio/Logo";

export const metadata: Metadata = {
  title: "Aviso de privacidad | YaContesto",
  description: "Qué datos recibe YaContesto cuando le escribes, para qué los usa y cómo pedir que se corrijan o se borren.",
  alternates: { canonical: "/privacidad/" },
};

/**
 * Aviso de privacidad de YaContesto para quien nos escribe (prospectos). Sigue lo que pide el artículo 15
 * de la LFPDPPP de 2025 (identidad y domicilio, datos, finalidades, cómo limitar su uso, derechos y
 * cambios). Diego lo aprobó tal cual el 7-oct-2026, con el domicilio como «Cuernavaca, Morelos» por ahora:
 * faltan el domicilio completo que pide el art. 15 y la revisión de un abogado. El 9-oct, a pedido de Diego,
 * sumó los mensajes por las redes (Facebook, Instagram y TikTok) y el correo soporte@. No cubre a los pacientes de
 * las clínicas: de ellos la clínica es la responsable (contratos, anexo de encargado).
 */
export default function Privacidad() {
  return (
    <>
      <header className="cabecera">
        <Link className="marca" href="/" aria-label="YaContesto, inicio">
          <Logo />
          YaContesto
        </Link>
      </header>
      <main className="aviso">
        <h1>Aviso de privacidad</h1>
        <p className="aviso-fecha">Última actualización: 9 de octubre de 2026.</p>

        <h2>Quién es el responsable</h2>
        <p>
          YaContesto es un servicio de Diego Javier Benítez, con domicilio en {PIE.ciudad}, México. Para cualquier asunto
          de tus datos, escríbenos a <a href={`mailto:${PIE.correo}`}>{PIE.correo}</a>.
        </p>

        <h2>Qué datos recibimos</h2>
        <p>Este sitio no tiene formularios, no usa cookies ni herramientas de analítica. Recibimos datos solo cuando nos escribes por WhatsApp, por correo o por mensaje en nuestras redes (Facebook, Instagram y TikTok):</p>
        <ul>
          <li>tu nombre y tu número de WhatsApp, tu correo o tu usuario en la red desde la que nos escribas;</li>
          <li>el nombre de tu clínica, su ciudad y lo que nos cuentes de ella (servicios, horarios, cómo agendan).</li>
        </ul>
        <p>
          No te pedimos datos personales sensibles. Por favor no nos mandes datos de salud de tus pacientes en esta
          plática.
        </p>
        <p>
          El servicio que hospeda el sitio puede registrar datos técnicos de la visita, como la dirección IP, para
          operarlo y protegerlo.
        </p>

        <h2>Para qué los usamos</h2>
        <ul>
          <li>contestarte y darte la información que nos pidas;</li>
          <li>prepararte una propuesta y, si la aceptas, coordinar la instalación.</li>
        </ul>
        <p>No los usamos para nada más: no los vendemos ni los usamos para publicidad.</p>

        <h2>Con quién los compartimos</h2>
        <p>
          Con nadie, salvo los servicios con que nos comunicamos contigo (WhatsApp, Facebook e Instagram, de Meta;
          TikTok; y nuestro proveedor de correo) y una autoridad que lo pida conforme a la ley.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedir ver tus datos, corregirlos, que los borremos o que dejemos de usarlos (derechos de acceso,
          rectificación, cancelación y oposición), y retirar tu consentimiento. Escríbenos a{" "}
          <a href={`mailto:${PIE.correo}`}>{PIE.correo}</a> con tu nombre y qué quieres que hagamos; te contestamos por
          el mismo medio en los plazos que marca la ley.
        </p>

        <h2>Cambios a este aviso</h2>
        <p>Si cambia, publicamos la versión nueva en esta página, con su fecha.</p>

        <p>
          <Link className="boton-obra" href="/">
            Volver al inicio
          </Link>
        </p>
      </main>
    </>
  );
}
