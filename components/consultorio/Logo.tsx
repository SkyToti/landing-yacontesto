/**
 * El logo de YaContesto (Diego, 7-oct-2026; generador en proyecto/ventas/rebranding/logo/logo-actual.mjs):
 * el globo de chat con la palomita HUECA, que deja ver el fondo. Toma el color de la marca (currentColor):
 * crema de noche y tinta de día. La caja del viewBox es lo que se ve, con el trazo de la cola (CAJA en el
 * generador), así que el tamaño en CSS es el del dibujo.
 */
export function Logo() {
  return (
    <svg className="marca-logo" viewBox="0.7 3.2 46.6 47.2" fill="currentColor" aria-hidden="true" focusable="false">
      <path
        fillRule="evenodd"
        d="M14.5 4.2H33.5A12.8 12.8 0 0 1 46.3 17V28A12.8 12.8 0 0 1 33.5 40.8H14.5A12.8 12.8 0 0 1 1.7 28V17A12.8 12.8 0 0 1 14.5 4.2ZM10.87 25.13L17.87 32.13A2.3 2.3 0 0 0 21.13 32.13L37.13 16.13A2.3 2.3 0 0 0 33.87 12.87L19.5 27.25L14.13 21.87A2.3 2.3 0 0 0 10.87 25.13Z"
      />
      <path d="M7.2 36.2 7.2 49.4 19.8 40.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
