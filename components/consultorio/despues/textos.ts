/**
 * Lo que sigue al día (R-1, paso 6): la página normal, sobre la noche. Instalación, precio, preguntas,
 * cierre y pie. Guion: proyecto/ventas/rebranding/GUION-LANDING.md, «Después del día».
 *
 * Los datos no se repiten aquí: los pasos son PASOS_INSTALACION, el precio es PRECIO y las preguntas son
 * PREGUNTAS, todos en `components/historia/datos.ts`. Aquí van solo los textos de la página.
 *
 * Cotejo (7-oct-2026):
 * - Precio fundador $2,900 + $990 hasta 300 pacientes atendidos, $1,490 hasta 800 y $3 por paciente arriba
 *   de 800; lista $5,900 + desde $1,490: CLAUDE.md §2 (escalera confirmada el 22-sep) y PRECIO. Sin número
 *   de lugares (Diego, 1-oct).
 * - «Pagas la instalación el día que la hacemos… te devolvemos el 100 %»: el modelo de cobro estándar de
 *   CLAUDE.md §2 (8-sep). Mismo texto que la landing publicada.
 * - «Paciente atendido»: una persona distinta atendida por el asistente en el mes, con todos sus mensajes
 *   (CLAUDE.md §2, «conversación»). Mismo texto que la landing publicada.
 * - Los textos marcados «ya aprobado» salen tal cual de la landing publicada (yacontesto.com, `main`).
 */

export const INSTALACION = {
  titulo: "Así lo instalamos.",
  // Ya aprobado (landing publicada, escena de la instalación).
  texto: "Tu parte: contarnos de tu clínica y probarlo con nosotros.",
};

/** Todo ya aprobado: son los textos de la sección del precio de la landing publicada. */
export const TEXTOS_PRECIO = {
  titulo: "Solo pagas por lo que atiendes.",
  texto: "Una instalación y una mensualidad según cuántos pacientes atiende tu asistente.",
  garantia: "Pagas la instalación el día que la hacemos. Si a los 14 días decides no seguir, te devolvemos el 100 %.",
  fundador: "Precio fundador para las primeras clínicas.",
  pregunta: "¿Cuántos pacientes distintos te escriben al mes?",
  atendido: "Una persona distinta que tu asistente atendió en el mes, con todos sus mensajes. Si escribe diez veces, cuenta una.",
  boton: "Pedir el precio fundador por WhatsApp",
};

export const TITULO_PREGUNTAS = "Lo que todo dentista nos pregunta";

/**
 * El cierre. El titular es el del guion aprobado: aquí sale el nombre de Moli, la única vez en la página.
 * Si cambia el nombre, se cambia aquí.
 */
export const CIERRE = {
  nombre: "Moli",
  resto: "se queda de guardia. ¿Platicamos?",
  texto: "Escríbenos y te enseñamos el asistente con los servicios y precios de tu clínica.",
  boton: "Escríbenos por WhatsApp",
  /** Para lectores de pantalla: el dibujo va aria-hidden. */
  dibujo: "Ilustración: Moli, despierto en la luz del celular de la clínica, levanta un letrero que dice «¡Escríbenos!».",
  /** Lo que contesta Moli si lo tocan: una notita por toque, en este orden. */
  notas: ["¡ya contesto!", "¡aquí ando!", "¿platicamos?"],
};

export const PIE = {
  // Ya aprobado (pie de la landing publicada).
  queEs: "Recepcionista con inteligencia artificial para el WhatsApp de clínicas dentales.",
  ficticia: "Ejemplo con una clínica ficticia: las conversaciones y los pacientes de esta página son inventados.",
  // Ya aprobado (pie de la landing publicada).
  legal: "Servicio independiente: no estamos afiliados a WhatsApp ni a Meta Platforms, Inc.",
  correo: "diego@yacontesto.com",
  ciudad: "Cuernavaca, Morelos",
  /** El WhatsApp de ventas (CLAUDE.md §3), escrito para leerse. */
  telefono: "+52 220 639 5955",
};
