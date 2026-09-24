import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FAQ Accordion de Vengeance UI (MIT, © Ashutoshx7), adaptado a YaContesto.
 *
 * Se conserva su anatomía: lista de preguntas con un signo que cambia de + a − y un galón que
 * gira, una sola abierta a la vez y la respuesta que se despliega por altura.
 * Cambios: el estado lo lleva el navegador con <details name> (exclusivo, sin JavaScript, con
 * teclado y lectores de pantalla nativos); la altura se anima con `interpolate-size` donde
 * existe; sin el borde lateral grueso del original (el sistema de diseño separa con líneas
 * finas dobles), y el título lo pone la sección.
 */
export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export function FaqAccordion({ items, nombre, className }: { items: FaqItem[]; nombre: string; className?: string }) {
  return (
    <div className={cn("faq", className)}>
      {items.map((item) => (
        <details key={item.question} name={nombre} className="faq-item">
          <summary className="faq-pregunta">
            <span className="faq-signo" aria-hidden="true" />
            <span className="faq-texto">{item.question}</span>
            <span className="faq-galon" aria-hidden="true" />
          </summary>
          <div className="faq-respuesta">
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export default FaqAccordion;
