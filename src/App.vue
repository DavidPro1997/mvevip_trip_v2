<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSesionStore } from '@/stores/sesion';
import { useConexion } from '@/composables/useConexion';
import { useMusica } from '@/composables/useMusica';
import { SinConexionError } from '@/services/api';
import { personalizacionDe } from '@/services/reservas';
import BarraSinConexion from '@/components/BarraSinConexion.vue';
import Cabecera from '@/components/Cabecera.vue';
import PieDePagina from '@/components/PieDePagina.vue';
import Avisos from '@/components/Avisos.vue';
import BotonMusica from '@/components/BotonMusica.vue';

const sesion = useSesionStore();
const { enLinea } = useConexion();
const route = useRoute();
const router = useRouter();

const conMarco = computed(() => route.name && route.name !== 'login');

/**
 * Actualiza las reservas en segundo plano (al abrir la app y al volver el internet).
 * Sin internet no pasa nada: se sigue mostrando lo guardado.
 */
async function actualizarEnSegundoPlano() {
  if (!sesion.haySesion || !enLinea.value) return;
  try {
    const sigue = await sesion.actualizar();
    if (!sigue) router.replace({ name: 'login' });
  } catch (e) {
    if (!(e instanceof SinConexionError)) console.warn('No se pudo actualizar la sesión', e);
  }
}

// Alto real de lo fijo de arriba (cabecera + aviso sin conexión): lo usan las partes fijas de las páginas
const arriba = ref(null);
const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(([entrada]) => {
  document.documentElement.style.setProperty('--alto-arriba', `${Math.round(entrada.contentRect.height)}px`);
});
onBeforeUnmount(() => observador?.disconnect());

onMounted(() => {
  if (arriba.value) observador?.observe(arriba.value);
  actualizarEnSegundoPlano();
  // Si ya había sesión (abrió sin internet o es la primera vez con esta versión), guarda los documentos
  if (sesion.haySesion && enLinea.value) sesion.guardarParaSinConexion();
});

// Música de la personalización del viaje (el botón flotante la controla)
const musica = useMusica();
const urlMusica = computed(() => (sesion.haySesion ? personalizacionDe(sesion.reservas)?.musica ?? '' : ''));
watch(urlMusica, (url) => (url ? musica.cargar(url) : musica.detener()), { immediate: true });

watch(enLinea, (ahora) => {
  if (ahora) actualizarEnSegundoPlano();
});
</script>

<template>
  <div class="app">
    <!-- Arriba y fijos: aviso de sin conexión + cabecera -->
    <div ref="arriba" class="arriba">
      <BarraSinConexion />
      <Cabecera v-if="conMarco" />
    </div>

    <div class="pagina">
      <RouterView v-slot="{ Component }">
        <Transition name="pagina" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>

    <PieDePagina v-if="conMarco" />
    <BotonMusica v-if="sesion.haySesion" />
    <Avisos />
  </div>
</template>

<style>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.arriba {
  position: sticky;
  top: 0;
  z-index: 30;
}

.pagina {
  flex: 1;
}

.pagina-enter-active,
.pagina-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pagina-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.pagina-leave-to {
  opacity: 0;
}
</style>
