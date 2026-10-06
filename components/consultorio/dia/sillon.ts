/**
 * El consultorio (la zona derecha del escenario, `GUION-LANDING.md` §2): el sillón dental, la lámpara,
 * el diploma y el doctor, que atiende a un paciente con las manos ocupadas. Va a la derecha de la
 * recepción, en las mismas unidades del lienzo (x de 480 a 900, y de 0 a 900), con las reglas de Moli:
 * trazo de marcador, puntas redondas y ninguna curva perfecta. Las personas son monitos de trazo fino
 * (regla 7 de Adrien Lamy), como Ana.
 * Lo usan el plano general de día (la cámara llega aquí en la T3) y, recortado, el fondo del primer
 * plano de las 16:05.
 */
import { ENCENDIDO, forma, linea } from "../noche/dibujo";

const T = "#0E100F";
const C = "#FFFCE1";
const B = "#FFFFFF";
const e = ENCENDIDO;

/** La caja del consultorio en el lienzo: empieza donde termina la recepción. */
export const CAJA_CONSULTORIO = { x: 480, ancho: 420 };
/** Hacia dónde mira la cámara al llegar: el doctor y la cabeza del paciente. */
export const PUNTOS_CONSULTORIO = { centro: { x: 676, y: 640 } };
/** El recorte del fondo del primer plano de las 16:05: el doctor, el paciente y la lámpara. */
export const RECORTE_FONDO = "506 474 300 196";

/** Un monito de trazo fino: sin relleno pesado, puntas redondas. */
const fino = (d: string, ancho = 3.4) => linea(d, T, ancho);
const circulo = (cx: number, cy: number, r: number, relleno: string, ancho = 3.4) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${relleno}" stroke="${T}" stroke-width="${ancho}"/>`;

function pared() {
  return [
    linea("M480 843Q600 848 700 844T900 846", T, 5),
    // El muro que separa la recepción del consultorio.
    forma("M486 330L502 331L503 846L485 845Z", e, 5),
    // El diploma del doctor.
    forma("M744 410Q778 408 814 411L813 462Q778 465 745 462Z", e, 4.5, B),
    linea("M756 424h46M756 434h46M762 444h34", T, 2, ' opacity=".45"'),
    `<circle cx="800" cy="452" r="5" fill="#0AE448" stroke="${T}" stroke-width="2"/>`,
  ].join("");
}

function lampara() {
  return [
    // Poste, brazo y la cabeza de la lámpara sobre la boca del paciente.
    linea("M884 846L883 508Q883 494 868 493L716 488", T, 6),
    forma("M676 478Q708 470 740 480L733 503Q707 510 682 502Z", e, 5),
    linea("M694 516l-6 10M708 519v12M722 516l6 10", T, 2.6),
  ].join("");
}

/** El sillón en tinta (como la cabeza del calendario): el paciente, de blanco, se lee encima. */
function sillon() {
  return [
    // El pie y su base.
    forma("M734 724L728 800H790L784 724Z", e, 5),
    forma("M700 800Q758 794 816 800L820 842Q758 847 696 842Z", e, 5),
    // Respaldo, asiento y piernera, reclinados; la cabecera aparte.
    forma("M622 648L716 702L794 702L872 758L860 780L788 728L710 730L614 672Z", e, 6, T),
    forma("M592 636Q612 626 634 638L628 666Q608 672 590 660Z", e, 5, T),
  ].join("");
}

/** El paciente, acostado en el sillón: ropa blanca, babero crema, ojos cerrados y la boca abierta. */
function paciente() {
  return [
    forma("M626 630Q670 640 718 668L798 668L870 724L860 738L792 690L714 692Q668 670 624 650Z", e, 3.4, B),
    forma("M634 638L658 646L652 664L628 656Z", e, 3, C),
    circulo(614, 622, 14, C),
    fino("M605 615h5M615 613h5", 2.6),
    `<ellipse cx="619" cy="629" rx="3.4" ry="2.6" fill="${T}"/>`,
    forma("M866 718Q880 714 886 726L872 734Z", e, 3, T),
  ].join("");
}

/**
 * El doctor: bata blanca, gorro y cubrebocas, inclinado sobre el paciente con el espejito y el
 * explorador. Las manos ocupadas son el punto de la escena: no puede contestar el WhatsApp. Las manos
 * quedan a la izquierda de la cara del paciente; solo las puntas de los instrumentos llegan a la boca.
 */
function doctor() {
  return [
    fino("M540 704L535 842M564 704L569 842"),
    forma("M532 566Q550 560 570 568L586 704Q552 712 518 704Z", e, 3.4, B),
    fino("M551 574V700", 2.4),
    // Los brazos, hacia la boca del paciente, con sus instrumentos.
    fino("M568 576L594 604"),
    fino("M536 580Q548 606 592 618"),
    fino("M594 604L614 624", 2.4),
    circulo(615, 625, 3, B, 2.2),
    fino("M592 618L612 630", 2.4),
    // Cabeza, gorro y cubrebocas; los ojos miran al paciente.
    circulo(552, 544, 16, C),
    forma("M536 538Q550 520 568 536L567 541Q551 535 537 543Z", e, 3, B),
    forma("M540 550Q554 546 568 551L566 560Q554 565 542 560Z", e, 2.6, B),
    `<circle cx="551" cy="544" r="1.9" fill="${T}"/><circle cx="561" cy="545" r="1.9" fill="${T}"/>`,
  ].join("");
}

export function consultorio() {
  return pared() + lampara() + sillon() + paciente() + doctor();
}
