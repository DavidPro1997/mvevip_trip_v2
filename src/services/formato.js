/** Fechas de la API: "YYYY-MM-DD HH:MM:SS" o "YYYY-MM-DD" (hora local del destino) */
export function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  const texto = String(valor).trim();
  // Solo fecha: se toma al mediodía para que la zona horaria no la mueva de día
  const fecha = new Date(/^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T12:00:00` : texto.replace(' ', 'T'));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const LOCALE = 'es-EC';

/** 04 jul 2026 */
export function fechaCorta(valor) {
  const fecha = aFecha(valor);
  return fecha ? fecha.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' }) : String(valor ?? '');
}

/** sábado, 04 de julio de 2026 */
export function fechaLarga(valor) {
  const fecha = aFecha(valor);
  return fecha ? fecha.toLocaleDateString(LOCALE, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : String(valor ?? '');
}

/** 16:59 (vacío si la fecha no trae hora) */
export function hora(valor) {
  const texto = String(valor ?? '');
  const fecha = aFecha(texto);
  if (!fecha || !/[ T]\d{2}:\d{2}/.test(texto)) return '';
  return fecha.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Clave del día para agrupar: 2026-07-04 */
export function claveDia(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return null;
  const dosDigitos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** "hace 5 min", "hace 2 h", "ayer"... para "Actualizado ..." */
export function haceCuanto(fecha, ahora = new Date()) {
  if (!fecha) return '';
  const minutos = Math.round((ahora - new Date(fecha)) / 60000);
  if (minutos < 1) return 'justo ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

/** "JUAN CARLOS PÉREZ" → "Juan Carlos Pérez" */
export function nombrePropio(texto) {
  return String(texto ?? '')
    .trim()
    .toLocaleLowerCase('es')
    .replace(/(^|[\s-])(\p{L})/gu, (_, separador, letra) => separador + letra.toLocaleUpperCase('es'));
}
