/**
 * Archivos guardados en el teléfono (PDFs, imágenes y música de las reservas) para usarlos sin conexión.
 *
 * - Proxy de S3 (PROXY_S3): donde existe (desarrollo con Vite y Docker con nginx) las URLs firmadas se
 *   piden por el mismo dominio de la app (/s3/<zona>/<ruta>?<firma>) y así se pueden leer aunque el
 *   bucket no tenga CORS. En producción (S3 + CloudFront) no hay proxy: se piden directo a S3.
 *   Las imágenes y el audio se ven igual; leer un PDF (visor y guardado sin conexión) necesita que el
 *   bucket tenga CORS para el dominio de la app (ver README).
 * - En la caché la llave es la ruta SIN la firma (y sin importar si se pidió por el proxy o directo):
 *   cuando la API vuelve a firmar el mismo archivo se sigue encontrando, y sin internet se abre
 *   aunque la firma ya venció.
 * - Este archivo lo usan la app y el service worker (src/sw.js): no debe usar nada del DOM.
 */
export const CACHE_ARCHIVOS = 'mvevip-archivos-v2';
// Imágenes de otros dominios (servicios complementarios): caché aparte, se pueden expirar
export const CACHE_IMAGENES = 'mvevip-imagenes-v1';
// Cachés de versiones anteriores que se borran (la v1 pudo guardar el index.html en lugar de un PDF)
export const CACHES_VIEJAS = ['mvevip-archivos-v1'];

// Debe coincidir con el proxy de vite.config.js y nginx/default.conf.template
const HOSTS_S3 = {
  'mvevipv2.s3.amazonaws.com': 'global',
  'mvevipv2.s3.us-west-2.amazonaws.com': 'us-west-2',
};

/**
 * ¿Hay proxy /s3/? VITE_PROXY_S3=true|false lo fija; si no está, solo en desarrollo.
 * (El Dockerfile compila con VITE_PROXY_S3=true porque su nginx sí reenvía /s3/.)
 */
const env = import.meta.env ?? {};
export const PROXY_S3 = env.VITE_PROXY_S3 ? env.VITE_PROXY_S3 === 'true' : Boolean(env.DEV);

const origen = () => (typeof self !== 'undefined' && self.location ? self.location.origin : 'http://localhost');

/** { zona, ruta, consulta } si la URL es del bucket (directa o por el proxy /s3/<zona>/...); si no, null */
function partesS3(url) {
  try {
    const u = new URL(url, origen());
    const zona = HOSTS_S3[u.hostname];
    if (zona) return { zona, ruta: u.pathname, consulta: u.search };
    const local = u.origin === origen() && u.pathname.match(/^\/s3\/([^/]+)(\/.*)$/);
    return local ? { zona: local[1], ruta: local[2], consulta: u.search } : null;
  } catch {
    return null;
  }
}

export const esHostS3 = (hostname) => Boolean(HOSTS_S3[hostname]);

/** URL que usa la app: con proxy, las de S3 pasan por /s3/...; sin proxy (o si no es de S3) queda igual. */
export function urlLocal(url, conProxy = PROXY_S3) {
  if (!url || !conProxy) return url || '';
  try {
    const u = new URL(url, origen());
    const zona = HOSTS_S3[u.hostname];
    return zona ? `/s3/${zona}${u.pathname}${u.search}` : url;
  } catch {
    return url;
  }
}

export const esDeS3 = (url) => Boolean(url) && partesS3(url) !== null;

/** Llave en la caché: los archivos de S3 sin la firma (misma llave con o sin proxy); el resto, la URL completa. */
export function claveCache(url) {
  const s3 = partesS3(url);
  return s3 ? `${origen()}/s3/${s3.zona}${s3.ruta}` : new URL(url, origen()).href;
}

/** Una respuesta HTML no es un archivo: es la página de la app (hosting sin proxy /s3/) o un error */
const esHtml = (respuesta) => (respuesta.headers.get('content-type') ?? '').includes('text/html');

const abrirCache = (nombre = CACHE_ARCHIVOS) => (typeof caches === 'undefined' ? Promise.resolve(null) : caches.open(nombre));

/** Respuesta guardada del archivo (o undefined) */
export async function buscarGuardado(url) {
  const cache = await abrirCache();
  return cache ? cache.match(claveCache(url)) : undefined;
}

export async function estaGuardado(url) {
  return Boolean(await buscarGuardado(url));
}

/**
 * true si la URL firmada de S3 ya venció (firma v2: Expires; v4: X-Amz-Date + X-Amz-Expires).
 * Así no se le pide a S3 un archivo que va a responder 403.
 */
export function firmaVencida(url, ahora = Date.now()) {
  try {
    const p = new URL(url, origen()).searchParams;
    if (p.has('Expires')) return Number(p.get('Expires')) * 1000 <= ahora;
    const m = (p.get('X-Amz-Date') ?? '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    const duracion = Number(p.get('X-Amz-Expires'));
    if (m && duracion) return Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]) + duracion * 1000 <= ahora;
  } catch {
    /* URL rara: se intenta igual */
  }
  return false;
}

// Acepta una URL o un documento { url, ruta }
const aDocumento = (entrada) => (typeof entrada === 'string' ? { url: entrada } : entrada ?? {});

// Sin proxy y sin CORS en el bucket S3 no deja leer los archivos: después del primer intento
// fallido no se insiste (cada intento sería un error más en la consola) y se usa la API
let s3SinCors = false;

const hayRed = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

async function pedir(url) {
  if (s3SinCors && esDeS3(url)) throw new TypeError('S3 sin CORS');
  try {
    const respuesta = await fetch(urlLocal(url));
    if (esHtml(respuesta)) throw new TypeError('Llegó una página HTML en lugar del archivo');
    return respuesta;
  } catch (e) {
    if (!PROXY_S3 && esDeS3(url) && hayRed()) s3SinCors = true;
    throw e;
  }
}

/** Respuesta "de archivo" armada con el base64 que devuelve la API */
export function respuestaDeBase64(base64, tipo = 'application/octet-stream') {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Response(bytes, { status: 200, headers: { 'Content-Type': tipo } });
}

/**
 * Descarga un archivo de S3:
 * 1. con su URL firmada (si la firma venció o S3 responde 403, con un enlace nuevo: ayuda.renovar(ruta));
 * 2. si S3 no deja leerlo (sin CORS) o falla, el contenido por la API: ayuda.porApi(ruta).
 * @param {{ url: string, ruta?: string }} documento
 * @param {{ renovar?: (ruta: string) => Promise<string|null>, porApi?: (ruta: string) => Promise<Response|null> }} [ayuda]
 * @returns {Promise<Response|null>} null si no hay forma de descargarlo
 */
async function descargar({ url, ruta }, { renovar, porApi } = {}) {
  // Sin proxy (S3 + CloudFront) el navegador no puede leer el bucket: los documentos van por la API
  // directamente (sin un intento fallido antes, que dejaría un error de CORS en la consola)
  if (!PROXY_S3 && ruta && porApi) return porApi(ruta);

  let respuesta = null;
  let error = null;
  try {
    const puedeRenovar = Boolean(ruta && renovar);
    if (!firmaVencida(url)) {
      respuesta = await pedir(url);
      if (!respuesta.ok && respuesta.status === 403 && puedeRenovar) respuesta = null;
    }
    if (!respuesta && puedeRenovar) {
      const nueva = await renovar(ruta);
      respuesta = nueva ? await pedir(nueva) : null;
    }
  } catch (e) {
    error = e;
    respuesta = null;
  }
  if (respuesta?.ok) return respuesta;
  if (ruta && porApi) return porApi(ruta);
  if (error) throw error;
  return respuesta;
}

/**
 * Descarga y guarda un archivo (si ya está guardado no lo vuelve a bajar). Los de S3 se leen
 * completos (sirven para el visor de PDF); los de otros dominios se guardan opacos, solo para <img>.
 * @param {string|{url: string, ruta?: string}} entrada
 * @param {{ renovar?: Function, porApi?: Function }} [ayuda] ver descargar()
 * @returns {Promise<boolean>} true si quedó guardado
 */
export async function guardarArchivo(entrada, ayuda) {
  const documento = aDocumento(entrada);
  if (!documento.url) return false;
  const propio = esDeS3(documento.url);
  const cache = await abrirCache(propio ? CACHE_ARCHIVOS : CACHE_IMAGENES);
  if (!cache) return false;
  if (await cache.match(claveCache(documento.url))) return true;
  try {
    // Sin CORS solo se pueden guardar los que la API entrega (documentos con ruta)
    // (las imágenes de S3 las guarda el service worker cuando se muestran en pantalla)
    if (propio && !documento.ruta && (s3SinCors || !PROXY_S3)) return false;
    const respuesta = propio ? await descargar(documento, ayuda) : await fetch(documento.url, { mode: 'no-cors' });
    if (!respuesta || (propio ? !respuesta.ok : respuesta.type !== 'opaque' && !respuesta.ok)) return false;
    await cache.put(claveCache(documento.url), respuesta);
    return true;
  } catch {
    return false;
  }
}

/**
 * Bytes de un archivo de S3 para el visor.
 * Con internet se descarga fresco (y se actualiza la copia guardada); si falla, la copia guardada.
 * Sin internet, la copia guardada.
 * @param {string|{url: string, ruta?: string}} entrada
 * @param {{ renovar?: Function, porApi?: Function }} [ayuda] ver descargar()
 * @returns {Promise<ArrayBuffer>}
 */
export async function obtenerArchivo(entrada, ayuda) {
  const documento = aDocumento(entrada);
  let error = null;

  if (hayRed()) {
    try {
      const respuesta = await descargar(documento, ayuda);
      if (respuesta?.ok) {
        const copia = respuesta.clone();
        abrirCache().then((cache) => cache?.put(claveCache(documento.url), copia)).catch(() => {});
        return respuesta.arrayBuffer();
      }
      error = new Error(`No se pudo descargar el archivo (${respuesta?.status ?? 'sin respuesta'})`);
    } catch (e) {
      error = e;
    }
  }

  const guardado = await buscarGuardado(documento.url);
  if (guardado) return guardado.arrayBuffer();
  throw error ?? new Error('El archivo no está guardado en este dispositivo');
}

/** Guarda varios archivos (URLs o { url, ruta }) de a pocos; avisa el avance con alAvanzar(listos, total). */
export async function guardarVarios(entradas, alAvanzar = () => {}, { simultaneos = 3, ...ayuda } = {}) {
  const unicos = new Map();
  entradas.map(aDocumento).filter((d) => d.url).forEach((d) => {
    if (!unicos.has(d.url) || d.ruta) unicos.set(d.url, d);
  });
  const pendientes = [...unicos.values()];
  const total = pendientes.length;
  let listos = 0;
  alAvanzar(listos, total);
  const trabajador = async () => {
    while (pendientes.length) {
      await guardarArchivo(pendientes.shift(), ayuda);
      alAvanzar(++listos, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(simultaneos, total) }, trabajador));
}

/** Borra todos los archivos guardados (al cerrar sesión: son documentos personales) */
export async function borrarArchivos() {
  if (typeof caches !== 'undefined') await caches.delete(CACHE_ARCHIVOS);
}
