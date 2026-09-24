import { FaqAccordion } from "@/components/ui/faq-accordion";
import { PREGUNTAS } from "./datos";

/** Las 6 preguntas de la landing anterior, al día (coexistencia del número, cobro, cancelación). */
export function SeccionPreguntas() {
  return (
    <section className="cap cap-preguntas" id="preguntas" data-tema="dia" aria-labelledby="titulo-preguntas" tabIndex={-1}>
      <div className="preguntas">
        <h2 id="titulo-preguntas" className="titular-2">
          Lo que todo dentista nos pregunta
        </h2>
        <FaqAccordion nombre="preguntas" items={PREGUNTAS.map((q) => ({ question: q.p, answer: q.r }))} />
      </div>
    </section>
  );
}
