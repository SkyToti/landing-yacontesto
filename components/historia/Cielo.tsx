/** El cielo de la historia: el Director funde sus capas con el scroll (noche → día → noche). */
export function Cielo() {
  return (
    <div className="cielo" aria-hidden="true">
      <i className="cielo-noche" />
      <i className="cielo-madrugada" data-cielo="madrugada" />
      <i className="cielo-alba" data-cielo="alba" />
      <i className="cielo-dia" data-cielo="dia" />
      <i className="cielo-grano" />
    </div>
  );
}
