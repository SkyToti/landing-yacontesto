/**
 * Enlace entre los cilindros de mensajes (componente de cliente) y el Director (GSAP), que se
 * carga después. El Director guía el cilindro con el scroll sin que React vuelva a pintar.
 */
export type ControlTambor = {
  /** 0 = gira libre; 1 = la carta `indice` queda al frente. Valores intermedios mezclan. */
  guiar: (factor: number, indice: number) => void;
  /** Multiplica la opacidad: `otras` para todas las cartas menos la del frente, `frente` para esa. */
  atenuar: (otras: number, frente: number) => void;
  /** El elemento de la carta `indice`, para medirla (el vuelo del mensaje sale de ahí). */
  carta: (indice: number) => HTMLElement | null;
};

const tambores = new Map<string, ControlTambor>();
const esperas = new Map<string, Array<(control: ControlTambor) => void>>();

export function registrarTambor(id: string, control: ControlTambor) {
  tambores.set(id, control);
  esperas.get(id)?.forEach((resolver) => resolver(control));
  esperas.delete(id);
  return () => {
    if (tambores.get(id) === control) tambores.delete(id);
  };
}

export function cuandoTambor(id: string): Promise<ControlTambor> {
  const control = tambores.get(id);
  if (control) return Promise.resolve(control);
  return new Promise((resolver) => {
    const lista = esperas.get(id) ?? [];
    lista.push(resolver);
    esperas.set(id, lista);
  });
}
