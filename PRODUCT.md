# Product

<!-- impeccable:product-schema 1 -->

> Solo información pública: todo lo de aquí ya está publicado en yacontesto.com o sale del texto de
> esta landing (`components/historia/datos.ts`). No se escribió con la entrevista de `init`: el dueño
> pidió que este archivo lleve únicamente lo público, y cada dato se tomó del sitio.

## Platform

web

## Users

Dueños y dueñas de clínicas dentales en México, y quien lleva su recepción. Atienden pacientes todo
el día y el WhatsApp de la clínica se les acumula: de noche, en domingo, a la hora de la comida y
cuando entran varios chats al mismo tiempo. En la página deciden si piden una demostración por
WhatsApp.

## Product Purpose

YaContesto instala, hecho por nosotros, un asistente con inteligencia artificial en el WhatsApp de la
clínica. Contesta al instante con la información que la clínica aprueba (servicios, precios,
horarios y políticas), revisa la agenda antes de ofrecer una hora y deja la cita en el Google
Calendar de la clínica. El éxito para la clínica es no perder pacientes por contestar tarde; el éxito
de la página es que la clínica pida la demostración por WhatsApp.

## Positioning

No es un programa que la clínica configura: se entrega instalado y funcionando en 7 días, en el mismo
número de WhatsApp Business que ya usa la clínica, sin cambiar de número ni aprender un sistema.
Cubre a la recepción cuando no puede contestar; no la reemplaza.

## Operating Context

- El paciente escribe al WhatsApp de la clínica; el equipo sigue viendo y contestando los mismos
  chats en la app de WhatsApp Business del celular.
- Las citas viven en el Google Calendar de la propia clínica; el asistente consulta todos los
  calendarios que se le conecten antes de ofrecer una hora.
- Instalación: día 1, la clínica cuenta sus servicios, precios y horarios (15 minutos); días 2 a 6,
  se configura y se prueba con la clínica; día 7, empieza a contestar.

## Capabilities and Constraints

Lo que el asistente hace hoy (cada frase de la landing está verificada contra el código del bot):

- Contesta al instante, a cualquier hora, con los datos que aprueba la clínica.
- Revisa todos los calendarios conectados antes de ofrecer una hora; ofrece solo horas libres y no
  agenda encima de otra cita.
- Deja la cita en Google Calendar.
- Le pasa el chat a una persona del equipo cuando el paciente lo pide o cuando no sabe algo, y deja
  de contestar en esa conversación.
- Atiende a varios pacientes a la vez, cada uno en su conversación.
- Mueve y cancela citas por mensaje.
- Se acuerda de la conversación con cada paciente.
- No da diagnósticos ni recetas, y tiene prohibido inventar datos.

No existe hoy y no se promete en ningún texto: recordatorios automáticos, reporte semanal, panel del
cliente ni aviso al dueño cuando el chat pasa a una persona. En el chat de la demostración tampoco se
muestra «escribiendo…» ni «revisando tu agenda…»: el asistente no envía esos estados.

Precios publicados: precio fundador de $2,900 de instalación (de lista, $5,900) y mensualidad por
paciente atendido: $990 hasta 300 pacientes al mes, $1,490 hasta 800 y $3 por paciente arriba de 800.
Mes a mes, sin plazo forzoso. Garantía: si a los 14 días la clínica decide no seguir, se le devuelve
el 100 %.

Decisiones abiertas, marcadas en la página y nunca inventadas: cuántos lugares fundadores quedan
(«[N] lugares») y si la escalera de pacientes aplica igual al precio de lista.

## Brand Commitments

- Nombre: YaContesto. Isotipo: globo de mensaje con palomita, con la cola abajo a la derecha
  (`public/assets/isotipo.svg`).
- Voz: español de México, de tú, frases cortas y concretas; describe lo que pasa, no vende humo.
- Servicio independiente: no está afiliado a WhatsApp ni a Meta Platforms, Inc., y lo dice.
- Contacto público: WhatsApp de ventas +52 220 639 5955 y diego@yacontesto.com, en Cuernavaca, Morelos.

## Evidence on Hand

- La conversación de la demostración usa una clínica ficticia (limpieza dental, $700, 40 minutos) y
  pacientes ficticios. El cierre «Con gusto 🙂 Enseguida una persona de nuestro equipo le va a
  escribir.» es el texto real de la configuración de demostración.
- La demostración en vivo se pide por WhatsApp.
- No hay testimonios, casos de clínicas, logotipos de clientes, cifras de resultados ni prensa que se
  puedan publicar. No se inventan. Ninguna clínica real aparece sin su autorización por escrito.

## Product Principles

1. Solo se promete lo que el asistente hace hoy; lo que falta no se menciona.
2. Cada demostración muestra una capacidad real, con datos ficticios.
3. La clínica no cambia su forma de trabajar: su número, sus chats y su calendario siguen siendo suyos.
4. El asistente cubre a la recepción; no la sustituye.

## Accessibility & Inclusion

Sitio en español (es-MX), pensado primero para el celular. Con `prefers-reduced-motion` (o sin
JavaScript) la historia se muestra quieta y completa, con el estado final de cada animación.
