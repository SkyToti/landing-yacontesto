import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Esta página no existe | YaContesto",
  robots: { index: false },
};

/** La 404 de la exportación estática (out/404.html), en español y con camino de regreso. */
export default function NoEncontrada() {
  return (
    <main className="no-encontrada">
      <h1 className="titulo-paso">Esta página no existe.</h1>
      <p className="texto-paso">Quizá el enlace venía incompleto. Todo lo que hace el asistente está en el inicio.</p>
      <Link className="boton-obra" href="/">
        Ir al inicio
      </Link>
    </main>
  );
}
