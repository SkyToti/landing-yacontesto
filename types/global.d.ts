export {};

declare global {
  interface Window {
    /** El Director la enciende cuando la historia animada ya está armada. */
    __historiaLista?: boolean;
    /** El Director ya montó (React y su JavaScript llegaron); la historia se arma al primer gesto. */
    __directorVivo?: boolean;
  }
}
