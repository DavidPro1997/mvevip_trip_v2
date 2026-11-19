<script setup>
/**
 * Visor de PDF a pantalla completa con pdf.js (reemplaza el visor de Google Docs, que necesitaba internet).
 * El PDF sale de la caché del teléfono si ya se guardó; si no, se descarga y se guarda.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { Download, ExternalLink, LoaderCircle, Minus, Plus, X } from 'lucide-vue-next';
import { obtenerArchivo } from '@/services/archivos';
import { SinConexionError, hayInternet, linkDescarga } from '@/services/api';
import { useSesionStore } from '@/stores/sesion';
import { useAvisos } from '@/composables/useAvisos';
import { useContacto } from '@/composables/useContacto';
import { useConexion } from '@/composables/useConexion';

const props = defineProps({ documento: { type: Object, required: true } });
const emit = defineEmits(['cerrar']);

const sesion = useSesionStore();
const { mostrar, mostrarError, sinConexion } = useAvisos();
const { abrirEnlace } = useContacto();
const { enLinea } = useConexion();

const estado = ref('cargando'); // cargando | listo | error
const paginas = ref(0);
const zoom = ref(1);
const descargando = ref(false);
const lienzo = ref(null);
const pdf = shallowRef(null);
let bytes = null;
let renderizando = 0;

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 3;

async function cargarPdfjs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { default: worker } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs;
}

/** Dibuja todas las páginas al ancho de la pantalla × zoom */
async function dibujar() {
  const doc = pdf.value;
  const contenedor = lienzo.value;
  if (!doc || !contenedor) return;
  const turno = ++renderizando;
  const ancho = Math.min(contenedor.clientWidth - 24, 900) * zoom.value;
  const densidad = Math.min(window.devicePixelRatio || 1, 2);

  contenedor.querySelectorAll('canvas').forEach((c) => c.remove());
  for (let numero = 1; numero <= doc.numPages; numero++) {
    const pagina = await doc.getPage(numero);
    if (turno !== renderizando) return; // cambió el zoom mientras dibujaba
    const base = pagina.getViewport({ scale: 1 });
    const vista = pagina.getViewport({ scale: (ancho / base.width) * densidad });
    const canvas = document.createElement('canvas');
    canvas.width = vista.width;
    canvas.height = vista.height;
    canvas.style.width = `${vista.width / densidad}px`;
    canvas.className = 'pagina';
    canvas.setAttribute('aria-label', `Página ${numero}`);
    contenedor.appendChild(canvas);
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
  }
}

async function abrir() {
  estado.value = 'cargando';
  try {
    const [pdfjs, datos] = await Promise.all([cargarPdfjs(), obtenerArchivo(props.documento, sesion.ayudaArchivos)]);
    bytes = datos;
    // pdf.js se queda con el buffer: se le pasa una copia para poder descargarlo después
    pdf.value = await pdfjs.getDocument({ data: new Uint8Array(datos.slice(0)) }).promise;
    paginas.value = pdf.value.numPages;
    estado.value = 'listo';
    await nextTick();
    await dibujar();
  } catch (e) {
    console.warn('No se pudo abrir el PDF', e);
    estado.value = 'error';
  }
}

function cambiarZoom(paso) {
  const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((zoom.value + paso) * 100) / 100));
  if (nuevo === zoom.value) return;
  zoom.value = nuevo;
  dibujar();
}

/** Descargar: con internet, el link de descarga de la API (como antes); sin internet, el PDF guardado */
async function descargar() {
  const { ruta, url, titulo } = props.documento;
  if (!hayInternet()) {
    if (!bytes) return sinConexion();
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    enlace.download = `${(titulo || 'documento').replace(/[\\/:*?"<>|]+/g, ' ').trim()}.pdf`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 10000);
    return;
  }
  if (!ruta) return abrirEnlace(url);

  descargando.value = true;
  try {
    const datos = await linkDescarga(ruta, sesion.token);
    if (datos?.estado) window.open(datos.linkDescarga, '_blank', 'noopener');
    else mostrar(datos?.mensaje || 'No se pudo descargar el documento.', 'error');
  } catch (e) {
    if (e instanceof SinConexionError) sinConexion();
    else mostrarError(e);
  } finally {
    descargando.value = false;
  }
}

const alPresionarTecla = (e) => {
  if (e.key === 'Escape') emit('cerrar');
};

let redibujar;
const alCambiarTamano = () => {
  clearTimeout(redibujar);
  redibujar = setTimeout(dibujar, 200);
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', alPresionarTecla);
  window.addEventListener('resize', alCambiarTamano);
  abrir();
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', alPresionarTecla);
  window.removeEventListener('resize', alCambiarTamano);
  renderizando++;
  pdf.value?.destroy();
});
</script>

<template>
  <Teleport to="body">
    <div class="visor" role="dialog" aria-modal="true" :aria-label="documento.titulo">
      <header class="barra">
        <button type="button" class="boton-icono claro" aria-label="Cerrar" @click="emit('cerrar')">
          <X :size="22" />
        </button>
        <p class="titulo">{{ documento.titulo }}</p>
        <button type="button" class="boton-icono claro" :disabled="descargando" aria-label="Descargar" title="Descargar" @click="descargar">
          <LoaderCircle v-if="descargando" :size="20" class="girando" />
          <Download v-else :size="20" />
        </button>
      </header>

      <div ref="lienzo" class="lienzo">
        <div v-if="estado === 'cargando'" class="mensaje">
          <LoaderCircle :size="30" class="girando" aria-hidden="true" />
          <p>Abriendo documento…</p>
        </div>
        <div v-else-if="estado === 'error'" class="mensaje">
          <p>No se pudo abrir este documento.</p>
          <p class="texto-suave">
            {{ enLinea ? 'Puedes abrirlo en el navegador.' : 'Aún no está guardado en tu teléfono. Ábrelo cuando tengas internet.' }}
          </p>
          <div class="acciones-error">
            <button type="button" class="boton boton-secundario" @click="abrir">Reintentar</button>
            <button v-if="enLinea" type="button" class="boton" @click="abrirEnlace(documento.url)">
              <ExternalLink :size="16" aria-hidden="true" /> Abrir
            </button>
          </div>
        </div>
      </div>

      <div v-if="estado === 'listo'" class="zoom">
        <button type="button" class="boton-icono" aria-label="Alejar" :disabled="zoom <= ZOOM_MIN" @click="cambiarZoom(-0.25)">
          <Minus :size="18" />
        </button>
        <span class="nivel">{{ Math.round(zoom * 100) }}%</span>
        <button type="button" class="boton-icono" aria-label="Acercar" :disabled="zoom >= ZOOM_MAX" @click="cambiarZoom(0.25)">
          <Plus :size="18" />
        </button>
        <span class="separador"></span>
        <span class="nivel">{{ paginas }} {{ paginas === 1 ? 'página' : 'páginas' }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.visor {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: flex;
  flex-direction: column;
  background: #2a2d33;
}

.barra {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 58px;
  padding: 0 8px;
  padding-top: env(safe-area-inset-top, 0px);
  box-sizing: content-box;
  background: #17191d;
  color: #fff;
}

.claro {
  color: #fff;
}

.claro:hover {
  background: rgb(255 255 255 / 10%);
}

.titulo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 0.92rem;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lienzo {
  flex: 1;
  overflow: auto;
  padding: 12px 12px calc(84px + var(--abajo-seguro));
  -webkit-overflow-scrolling: touch;
}

.lienzo :deep(.pagina) {
  display: block;
  margin: 0 auto 12px;
  background: #fff;
  box-shadow: 0 4px 18px rgb(0 0 0 / 35%);
}

.mensaje {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 60%;
  color: #fff;
  text-align: center;
}

.mensaje .texto-suave {
  color: rgb(255 255 255 / 65%);
  max-width: 320px;
}

.acciones-error {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.zoom {
  position: absolute;
  left: 50%;
  bottom: calc(16px + var(--abajo-seguro));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.zoom .boton-icono:disabled {
  opacity: 0.35;
}

.nivel {
  min-width: 44px;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.separador {
  width: 1px;
  height: 20px;
  margin: 0 6px;
  background: var(--borde);
}
</style>
