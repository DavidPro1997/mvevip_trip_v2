import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Proxy de S3: el bucket no tiene CORS, así que los PDFs e imágenes se piden por /s3/<zona>/...
// (en Docker lo hace nginx, ver nginx/default.conf.template; aquí el servidor de desarrollo).
// Debe coincidir con HOSTS_S3 de src/services/archivos.js.
const proxyS3 = (prefijo, destino) => ({
  [prefijo]: {
    target: destino,
    changeOrigin: true, // Host = el de S3, si no la firma de la URL no es válida
    rewrite: (ruta) => ruta.slice(prefijo.length),
  },
});

// En desarrollo no hay service worker. Si el navegador tiene uno de una versión compilada que corrió
// en el mismo puerto, seguiría mostrando esa versión vieja guardada: /sw.js responde uno que borra
// la caché, se da de baja y recarga la página con el código actual.
const SW_LIMPIEZA = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil((async () => {
  await Promise.all((await caches.keys()).map((nombre) => caches.delete(nombre)));
  await self.registration.unregister();
  (await self.clients.matchAll({ type: 'window' })).forEach((cliente) => cliente.navigate(cliente.url));
})()));
`;
const limpiarServiceWorkerEnDesarrollo = {
  name: 'limpiar-service-worker-en-desarrollo',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-store');
      res.end(SW_LIMPIEZA);
    });
  },
};

export default defineConfig({
  plugins: [
    vue(),
    limpiarServiceWorkerEnDesarrollo,
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: false, // se registra en src/main.js
      manifest: {
        name: 'Billetera MKV',
        short_name: 'Billetera MKV',
        description: 'Tus reservas y documentos de viaje, incluso sin conexión.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f6f7f4',
        theme_color: '#ffffff',
        icons: [
          { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Los íconos ya entran por globPatterns (y el manifest lo agrega el plugin): así no se repiten
      includeManifestIcons: false,
      injectManifest: {
        // Todo el front queda guardado en el teléfono (incluido el visor de PDF)
        globPatterns: ['**/*.{js,mjs,css,html,png,jpg,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: Number(process.env.PUERTO_DEV) || 5173,
    strictPort: true,
    // En Docker (docker-compose.yml) escucha fuera del contenedor y revisa los archivos cada 300 ms:
    // en Windows los cambios de una carpeta montada no le llegan al contenedor como eventos
    host: process.env.VITE_EN_DOCKER === 'true' ? '0.0.0.0' : 'localhost',
    watch: process.env.VITE_EN_DOCKER === 'true' ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      ...proxyS3('/s3/global', 'https://mvevipv2.s3.amazonaws.com'),
      ...proxyS3('/s3/us-west-2', 'https://mvevipv2.s3.us-west-2.amazonaws.com'),
    },
  },
  test: {
    environment: 'node',
  },
});
