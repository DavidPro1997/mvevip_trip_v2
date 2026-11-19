/**
 * Service worker: la app completa queda guardada en el teléfono y abre sin internet.
 * - Precaché: HTML, JS, CSS, fuentes, íconos y el visor de PDF (lista que genera vite-plugin-pwa).
 * - Navegación: siempre index.html desde la caché (la SPA abre aunque no haya conexión).
 * - Archivos de S3 (PDFs, imágenes y música de las reservas), por el proxy /s3/... o directo al bucket:
 *   primero la caché (llave sin la firma, ver services/archivos.js). Por el proxy, si no está se
 *   descarga y se guarda; directo, se pide tal cual (sin CORS no se puede guardar). El audio usa Range (206).
 * - Imágenes de otros dominios (servicios complementarios): caché y se refrescan en segundo plano.
 */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { createPartialResponse } from 'workbox-range-requests';
import { CACHE_ARCHIVOS, CACHE_IMAGENES, CACHES_VIEJAS, claveCache, esHostS3 } from './services/archivos';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cachés de versiones anteriores (la v1 de archivos pudo guardar el index.html en lugar de un PDF)
self.addEventListener('activate', (evento) => {
  evento.waitUntil(Promise.all(CACHES_VIEJAS.map((nombre) => caches.delete(nombre))));
});

registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/s3\//] }));

const esHtml = (respuesta) => (respuesta.headers.get('content-type') ?? '').includes('text/html');

async function archivoDeS3({ request, url }) {
  const cache = await caches.open(CACHE_ARCHIVOS);
  const clave = claveCache(request.url);
  // Primero la copia guardada (documentos en CACHE_ARCHIVOS, imágenes directas en CACHE_IMAGENES)
  let respuesta = (await cache.match(clave)) ?? (await caches.match(clave, { cacheName: CACHE_IMAGENES }));

  if (!respuesta) {
    // Directo al bucket: se pide tal cual (una <img> no necesita CORS). Las imágenes se guardan
    // (opacas) para verlas sin internet; lo demás no se puede guardar sin CORS.
    if (url.origin !== self.location.origin) {
      const directa = await fetch(request);
      if (request.destination === 'image' && (directa.type === 'opaque' || directa.ok)) {
        caches.open(CACHE_IMAGENES).then((c) => c.put(clave, directa.clone())).catch(() => {});
      }
      return directa;
    }
    // Por el proxy: el archivo completo (sin Range) para guardarlo entero
    respuesta = await fetch(request.url);
    if (respuesta.ok && respuesta.status === 200 && !esHtml(respuesta)) await cache.put(clave, respuesta.clone());
  }
  if (request.headers.has('range') && respuesta.status === 200) {
    return createPartialResponse(request, respuesta);
  }
  return respuesta;
}

registerRoute(
  ({ url }) => (url.origin === self.location.origin && url.pathname.startsWith('/s3/')) || esHostS3(url.hostname),
  archivoDeS3,
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
  new StaleWhileRevalidate({
    cacheName: CACHE_IMAGENES,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, purgeOnQuotaError: true }),
    ],
  }),
);
