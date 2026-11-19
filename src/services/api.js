import { API_URL } from './config';

/** Se lanza cuando una acción necesita el backend y no hay internet (o el servidor no responde). */
export class SinConexionError extends Error {
  constructor(mensaje = 'No hay conexión a internet. Intenta de nuevo cuando estés conectado.') {
    super(mensaje);
    this.name = 'SinConexionError';
  }
}

export const hayInternet = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

/**
 * Llamada a la API del trip. Igual que el front anterior: Authorization = token tal cual y JSON.
 * Devuelve el JSON de la respuesta (aunque el status no sea 2xx: la API responde { estado, mensaje }).
 * @param {string} ruta ej. '/verificarSession'
 * @param {{ metodo?: string, cuerpo?: object, token?: string|null, consulta?: Record<string,string> }} [opciones]
 */
export async function peticion(ruta, { metodo = 'GET', cuerpo, token, consulta } = {}) {
  if (!hayInternet()) throw new SinConexionError();

  const url = new URL(API_URL + ruta);
  Object.entries(consulta ?? {}).forEach(([clave, valor]) => url.searchParams.set(clave, valor));

  const cabeceras = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = token;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    // fetch solo falla por red (sin internet, DNS, servidor caído)
    throw new SinConexionError('No pudimos conectarnos con el servidor. Revisa tu conexión a internet.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (datos === null) throw new Error(`El servidor respondió ${respuesta.status} sin datos.`);
  return datos;
}

/* ── Endpoints (los mismos del front anterior) ────────────────────────── */

export const iniciarSesion = (cedula) => peticion('/iniciarSession', { metodo: 'POST', cuerpo: { cedula } });

export const verificarSesion = (token) => peticion('/verificarSession', { token });

export const linkDescarga = (ruta, token) => peticion('/descargarDocumento', { token, consulta: { ruta } });

/** Contenido de un documento en base64 ({ estado, tipo, base64 }): para leer PDFs sin CORS en S3 */
export const archivoTrip = (ruta, token) => peticion('/obtenerArchivoTrip', { metodo: 'POST', cuerpo: { ruta }, token });

/* ── Complementa tu viaje: actividades (mismas reglas que el cotizador) ── */

/** Actividades visibles y con precio de esas ciudades (códigos, ej. ['MAD']). limite opcional. */
export const actividadesDeCiudades = (ciudades, token, limite) =>
  peticion('/obtenerActividadesTrip', { metodo: 'POST', cuerpo: { ciudades, limite }, token });

/** Ciudades con actividades para el buscador: [{ codigo, ciudad, total }] */
export const buscarCiudadesConActividades = (texto, token) =>
  peticion('/buscarDestinosActividadesTrip', { token, consulta: { q: texto } });

export const recomendacionesClima = (idTipos, token) =>
  peticion('/obtenerRecomendacionesClima', { metodo: 'POST', cuerpo: { idTipos }, token });
