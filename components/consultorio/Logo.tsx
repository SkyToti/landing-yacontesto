/**
 * El logo de YaContesto (Diego, 7-oct-2026; generador en proyecto/ventas/rebranding/logo/logo-actual.mjs):
 * el globo de chat con la palomita HUECA, que deja ver el fondo. Toma el color de la marca (currentColor):
 * crema de noche y tinta de día. La caja del viewBox es lo que se ve, con el trazo de la cola (CAJA en el
 * generador), así que el tamaño en CSS es el del dibujo.
 *
 * Detalle 1 (11-oct-2026, aprobado por Diego): la palomita se dibuja al abrir la página (CSS, base.css) y otra
 * vez al pasar el cursor por la marca (detalles.ts). Para que se pueda dibujar sin dejar de ser hueca, el
 * hueco es una máscara: el trazo negro de `.marca-palomita` (4.6 de grueso, puntas redondas) recorta el globo
 * igual que el hueco de evenodd de antes. Una sola vez por página (el id de la máscara no se repite).
 */
export function Logo() {
  return (
    <svg className="marca-logo" viewBox="0.7 3.2 46.6 47.2" fill="currentColor" aria-hidden="true" focusable="false">
      <defs>
        <mask id="logo-hueco" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="52">
          <rect x="0" y="0" width="48" height="52" fill="#fff" />
          <path
            className="marca-palomita"
            d="M12.5 23.5 19.5 30.5 35.5 14.5"
            pathLength={1}
            fill="none"
            stroke="#000"
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <path
        mask="url(#logo-hueco)"
        d="M14.5 4.2H33.5A12.8 12.8 0 0 1 46.3 17V28A12.8 12.8 0 0 1 33.5 40.8H14.5A12.8 12.8 0 0 1 1.7 28V17A12.8 12.8 0 0 1 14.5 4.2Z"
      />
      <path d="M7.2 36.2 7.2 49.4 19.8 40.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
