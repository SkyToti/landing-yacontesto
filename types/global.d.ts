export {};

declare global {
  interface Window {
    /** El Director la enciende cuando la historia animada ya está armada. */
    __historiaLista?: boolean;
  }
}
