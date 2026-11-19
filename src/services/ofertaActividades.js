/**
 * Actividades que se ofrecen en "Complementa tu viaje" (las mismas del cotizador: visibles y con precio).
 * Lógica sin interfaz: se prueba en tests/.
 */
import { destinosDe, idDeReserva } from './reservas';
import { nombrePropio } from './formato';

/** Cuántas actividades se muestran de entrada; "Ver más" muestra otras tantas */
export const POR_PAGINA = 8;

/** Códigos de ciudad de la reserva (= ciudad_id de las actividades), sin repetir y en orden de viaje. */
export function codigosDeReserva(reserva) {
  const codigos = destinosDe(reserva)
    .map((d) => String(d?.codigo ?? '').split(' - ')[0].trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(codigos)];
}

const dinero = (valor) => {
  const n = Number(valor) || 0;
  return `$${n.toLocaleString('es-EC', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
};

/** Precios mayores a cero, en orden: [{ etiqueta, valor }] */
export function preciosDe(actividad) {
  return [
    ['Adulto', actividad?.precioAdulto],
    ['Niño', actividad?.precioNino],
    ['Infante', actividad?.precioInfante],
    ['Tercera edad', actividad?.precioTerceraEdad],
  ]
    .filter(([, valor]) => Number(valor) > 0)
    .map(([etiqueta, valor]) => ({ etiqueta, valor: dinero(valor) }));
}

export const precioDesde = (actividad) => dinero(actividad?.precioAdulto);

/** Texto de pasajeros: "De 2 a 8 personas", "Mínimo 2 personas"... o '' si no tiene límite */
export function textoPasajeros(actividad) {
  const min = Number(actividad?.minPasajeros) || 0;
  const max = Number(actividad?.maxPasajeros) || 0;
  if (min && max) return min === max ? `${min} ${min === 1 ? 'persona' : 'personas'}` : `De ${min} a ${max} personas`;
  if (min > 1) return `Mínimo ${min} personas`;
  if (max) return `Máximo ${max} personas`;
  return '';
}

export const ciudadDe = (actividad) => nombrePropio(actividad?.ciudad || actividad?.codigoCiudad || '');

/** Mini detalle que se manda por WhatsApp al pedir la actividad */
export function mensajeActividad(actividad, reserva, usuario) {
  const cliente = nombrePropio(`${usuario?.nombres ?? ''} ${usuario?.apellidos ?? ''}`);
  const idReserva = idDeReserva(reserva);
  const precios = preciosDe(actividad).map((p) => `${p.etiqueta} ${p.valor}`).join(' · ');
  const pasajeros = textoPasajeros(actividad);
  const detalle = [
    idReserva && `• Reserva: #${idReserva}`,
    cliente && `• Cliente: ${cliente}`,
    `• Actividad: ${nombrePropio(actividad?.nombre)} (ID ${actividad?.id})`,
    `• Ciudad: ${ciudadDe(actividad)}${actividad?.codigoCiudad ? ` (${actividad.codigoCiudad})` : ''}`,
    precios && `• Precio: ${precios}`,
    pasajeros && `• Pasajeros: ${pasajeros}`,
  ].filter(Boolean);
  return ['Hola equipo de reservas de Marketing VIP, quisiera agregar esta actividad a mi viaje:', '', ...detalle].join('\n');
}
