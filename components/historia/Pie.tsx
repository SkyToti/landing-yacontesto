import { Isotipo } from "./Isotipo";

export function Pie() {
  return (
    <footer className="pie" data-tema="noche">
      <div className="pie-marca">
        <span className="marca">
          <Isotipo tamano={26} />
          YaContesto
        </span>
        <p>Recepcionista con inteligencia artificial para el WhatsApp de clínicas dentales.</p>
      </div>
      <div className="pie-datos">
        <p>Cuernavaca, Morelos</p>
        <p>
          <a href="mailto:diego@yacontesto.com">diego@yacontesto.com</a>
        </p>
      </div>
      <p className="pie-legal">Servicio independiente: no estamos afiliados a WhatsApp ni a Meta Platforms, Inc.</p>
    </footer>
  );
}
