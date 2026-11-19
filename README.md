# Billetera MKV (mvevip_trip)

App web para el cliente de Marketing VIP. Muestra sus reservas, documentos de viaje (identidad, tickets, boarding pass, seguro, SIM, adicionales y reserva), el itinerario de actividades y el clima. Después de la primera carga funciona **sin internet**.

Vue 3 + Vite + Pinia + Vue Router, como PWA (service worker con Workbox), servida con nginx en Docker. Usa la misma API que el front anterior (AngularJS + jQuery). Solo cambió el front.

## Correr con Docker

### Desarrollo (cambios en tiempo real)

```bash
cp .env.example .env        # ajusta VITE_API_URL si hace falta
docker compose up -d --build
```

La app queda en <http://localhost:8095> (el puerto se cambia con `PUERTO` en `.env`). Tu carpeta está montada en el contenedor y corre el servidor de desarrollo de Vite: **cada cambio que guardes en `src/` se ve al instante en el navegador**, sin reiniciar el contenedor. Los `.vue` se actualizan sin recargar la página; los `.js` recargan la página sola.

- Solo hay que reconstruir (`docker compose up -d --build`) si cambias `package.json` (dependencias nuevas).
- Si cambias `vite.config.js` o `.env`: `docker compose restart trip-dev`.
- En este modo no hay service worker (el modo sin conexión solo funciona en producción).

### Producción (nginx con la app compilada)

```bash
docker compose --profile prod up -d --build trip
```

Queda en <http://localhost:8096> (`PUERTO_PROD` en `.env`). Aquí `VITE_API_URL` se fija al **compilar** la imagen: si la cambias, vuelve a construirla.

| Ambiente   | VITE_API_URL                                              |
|------------|-----------------------------------------------------------|
| Local      | `http://localhost:5006`                                   |
| Producción | `https://68rpfit7kh.execute-api.us-west-2.amazonaws.com`  |

El build de la imagen corre también el lint y los tests. Si alguno falla, la imagen no se crea.

## Desarrollo sin Docker

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas de la lógica (vitest)
npm run lint
```

## Cómo funciona sin internet

- **App:** el service worker (`src/sw.js`) guarda todo el front, incluido el visor de PDF. La app abre sin conexión.
- **Datos:** el usuario y las reservas se guardan en `localStorage`, con las mismas llaves `usuario` y `reservas` del front anterior. Al abrir la app se muestran al instante. Si hay internet, se actualizan en segundo plano con `/verificarSession`.
- **Documentos:** al iniciar sesión, y en cada actualización, se descargan y guardan en el teléfono todos los PDFs e imágenes que el usuario puede ver. El avance se muestra en el inicio ("Guardando documentos para usarlos sin conexión"). En la caché la llave es la ruta del archivo sin la firma. Así el archivo se encuentra aunque la API lo vuelva a firmar, y se abre sin internet aunque la firma haya vencido.
- **Clima:** se guarda el último pronóstico de cada reserva.
- **Acciones que necesitan internet:** iniciar sesión, actualizar, WhatsApp y enlaces. Sin conexión muestran un aviso y la app sigue funcionando. Descargar un PDF sin conexión guarda la copia que ya está en el teléfono.
- **Cerrar sesión** borra del teléfono las reservas y los documentos guardados.

### Proxy de S3

El bucket `mvevipv2` no tiene CORS, así que el navegador no puede leer los PDFs directo de S3 para guardarlos. Por eso la app pide los archivos por el mismo dominio, `/s3/<zona>/<ruta>?<firma>`, y nginx los reenvía a S3 sin tocar la firma (`nginx/default.conf.template`). En desarrollo hace lo mismo el proxy de Vite (`vite.config.js`).

- Solo acepta los dos hosts del bucket (`mvevipv2.s3.amazonaws.com` y `mvevipv2.s3.us-west-2.amazonaws.com`) y solo GET/HEAD.
- Si aparece otro host o bucket, agrégalo en `HOSTS_S3` (`src/services/archivos.js`), en `vite.config.js` y en el template de nginx.

### Producción en S3 + CloudFront (sin proxy)

CloudFront no reenvía `/s3/` (responde el `index.html`). Por eso `npm run build` compila **sin proxy** (`VITE_PROXY_S3` sin definir = solo en desarrollo; el `Dockerfile` lo pone en `true` porque su nginx sí lo tiene):

- Imágenes y música se piden directo a S3: se ven sin necesidad de CORS. El service worker las guarda al mostrarlas, para verlas sin internet.
- Los PDFs (visor y guardado sin conexión) se piden a la API: `POST /obtenerArchivoTrip` con `{ ruta }` y el token devuelve el archivo en base64 (máx. 4 MB, solo rutas de `RESERVAS/`). Con internet el visor siempre baja la versión actual; sin internet abre la última copia guardada.
- Opcional: si algún día se agrega CORS al bucket, se puede leer directo de S3 (compilando con `VITE_PROXY_S3=false` igual, cambiar `descargar()` en `src/services/archivos.js` para no ir primero a la API).

Configuración de CORS del bucket, por si se necesita (S3 → `mvevipv2` → Permisos → CORS):

```json
[
  {
    "AllowedOrigins": ["https://trip.mvevip.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

## Estructura

```
src/
  main.js, App.vue, sw.js        arranque, layout y service worker
  router/                         rutas: /login, /inicio (alias /home), /reserva/:id
  stores/sesion.js                sesión, reservas, actualización y guardado sin conexión
  services/                       lógica sin interfaz (se prueba en tests/)
    api.js                        endpoints: iniciarSession, verificarSession, descargarDocumento, obtenerRecomendacionesClima
    reservas.js                   qué documentos ve cada viajero (billetera conjunta, facturas ocultas, mostrarTrip)
    archivos.js                   proxy de S3 y caché de archivos
    actividades.js, clima.js, formato.js, complementos.js, config.js, almacenamiento.js
  composables/                    conexión, avisos, música, WhatsApp/enlaces
  components/, views/             interfaz
nginx/default.conf.template       nginx: SPA, caché HTTP y proxy de S3
```

## Diferencias con el front anterior

- El visor de PDF es pdf.js. Antes era Google Docs Viewer, que necesitaba internet y fallaba seguido. Ahora se ve igual en iPhone y Android, con zoom.
- Las pestañas de la reserva solo aparecen si tienen contenido.
- "¿No puedes iniciar sesión?" abre WhatsApp. Antes no hacía nada.
- Los servicios complementarios dentro de una reserva se piden con el ID de esa reserva. En el inicio se usa la última reserva, como antes.
