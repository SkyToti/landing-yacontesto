import type { Metadata } from "next";
import Link from "next/link";
import { Isotipo } from "@/components/historia/Isotipo";

export const metadata: Metadata = {
  title: "Esta página no existe | YaContesto",
  robots: { index: false },
};

/** La 404 de la exportación estática (out/404.html), en español y con camino de regreso. */
export default function NoEncontrada() {
  return (
    <main className="no-encontrada" data-tema="noche">
      <Isotipo tamano={44} />
      <h1 className="titular-2">Esta página no existe.</h1>
      <p className="cuerpo">Quizá el enlace venía incompleto. Todo lo que hace el asistente está en el inicio.</p>
      <Link className="no-encontrada-enlace" href="/">
        Ir al inicio
      </Link>
    </main>
  );
}
