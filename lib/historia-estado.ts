/**
 * El estado de la historia que leen las islas de React (useSyncExternalStore): qué día mira la
 * agenda del teléfono y qué tarjeta del día está activa. Lo escribe el Director con el scroll.
 * Los valores iniciales son los del HTML del servidor (el estado final de cada escena).
 */
type Estado = { diaAgenda: number; diaActiva: number };

const INICIAL: Estado = { diaAgenda: 3, diaActiva: 0 };
const estado: Estado = { ...INICIAL };
const oyentes = new Set<() => void>();

export function fijarEstado(parcial: Partial<Estado>) {
  let cambio = false;
  for (const clave of Object.keys(parcial) as Array<keyof Estado>) {
    const valor = parcial[clave];
    if (valor !== undefined && estado[clave] !== valor) {
      estado[clave] = valor;
      cambio = true;
    }
  }
  if (cambio) oyentes.forEach((avisar) => avisar());
}

export function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

export const leer = (clave: keyof Estado) => () => estado[clave];
export const leerInicial = (clave: keyof Estado) => () => INICIAL[clave];
