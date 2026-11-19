<script setup>
import { computed, watch } from 'vue';
import { Music, Sparkles, X } from 'lucide-vue-next';
import { urlLocal } from '@/services/archivos';
import { useMusica } from '@/composables/useMusica';

/**
 * Bienvenida personalizada del viaje (port de mostrarModalBienvenida): tarjeta blanca sencilla con
 * la foto arriba (no de fondo), los logos, el saludo, la descripción y la música.
 */
const props = defineProps({
  abierto: { type: Boolean, default: false },
  nombre: { type: String, default: '' },
  personalizacion: { type: Object, required: true },
});
const emit = defineEmits(['cerrar']);
const musica = useMusica();

const fotos = computed(() => [props.personalizacion.imagen1, props.personalizacion.imagen2].filter(Boolean).map(urlLocal));
const logo = computed(() => urlLocal(props.personalizacion.logo || ''));

// Al abrir se intenta sonar la música (App.vue ya la cargó); si el navegador lo bloquea, suena al tocar "Empecemos"
watch(
  () => props.abierto,
  (abierto) => {
    if (abierto) musica.reproducir();
  },
  { immediate: true },
);

function empezar() {
  // Tocar el botón cuenta como interacción: el navegador ya deja sonar la música
  musica.reproducir();
  emit('cerrar');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bienvenida">
      <div v-if="abierto" class="fondo" role="dialog" aria-modal="true" aria-labelledby="bienvenida-titulo" @click.self="empezar">
        <div class="tarjeta-bienvenida">
          <button type="button" class="cerrar" aria-label="Cerrar" @click="empezar"><X :size="18" /></button>

          <!-- Fotos del viaje: una grande, o dos lado a lado -->
          <div v-if="fotos.length" class="fotos" :class="{ dos: fotos.length > 1 }">
            <img v-for="foto in fotos" :key="foto" :src="foto" alt="" />
          </div>

          <div class="contenido">
            <div class="logos">
              <img src="/img/logo.png" alt="Marketing VIP" class="logo-mvevip" />
              <template v-if="logo">
                <span class="mas" aria-hidden="true">+</span>
                <img :src="logo" alt="" class="logo-cliente" />
              </template>
            </div>

            <p class="etiqueta"><Sparkles :size="14" aria-hidden="true" /> Preparado especialmente para ti</p>
            <h2 id="bienvenida-titulo" class="titulo">¡Hola, {{ nombre }}!</h2>
            <p class="texto">
              {{ personalizacion.descripcion || 'Mira lo que hemos preparado para tu viaje. Aquí encontrarás tus documentos, tu itinerario y todo lo que necesitas.' }}
            </p>

            <p v-if="personalizacion.musica" class="musica"><Music :size="15" aria-hidden="true" /> Tu viaje tiene su propia música</p>

            <button type="button" class="boton boton-marca empezar" @click="empezar">Empecemos</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fondo {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(11 19 36 / 55%);
  backdrop-filter: blur(6px);
}

.tarjeta-bienvenida {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  border-radius: var(--radio-xl);
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.cerrar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 92%);
  color: var(--texto);
  box-shadow: var(--sombra-1);
  cursor: pointer;
}

.fotos {
  display: grid;
  gap: 6px;
  padding: 8px 8px 0;
}

.fotos.dos {
  grid-template-columns: 1fr 1fr;
}

.fotos img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 20px;
  background: var(--superficie-2);
}

.fotos.dos img {
  height: 170px;
}

.contenido {
  padding: 22px 26px 26px;
}

.logos {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mvevip {
  height: 28px;
  width: auto;
}

.mas {
  color: var(--suave);
  font-weight: 600;
}

.logo-cliente {
  max-width: 110px;
  max-height: 34px;
  object-fit: contain;
}

.etiqueta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--marca-suave);
  color: var(--marca-oscura);
  font-size: 0.78rem;
  font-weight: 700;
}

.titulo {
  margin-top: 10px;
  font-size: 1.8rem;
  font-weight: 800;
}

.texto {
  margin-top: 8px;
  color: var(--texto-2);
  white-space: pre-line;
}

.musica {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--violeta);
  font-size: 0.85rem;
  font-weight: 600;
}

.empezar {
  width: 100%;
  margin-top: 22px;
}

.bienvenida-enter-active,
.bienvenida-leave-active {
  transition: opacity 0.25s ease;
}

.bienvenida-enter-active .tarjeta-bienvenida,
.bienvenida-leave-active .tarjeta-bienvenida {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bienvenida-enter-from,
.bienvenida-leave-to {
  opacity: 0;
}

.bienvenida-enter-from .tarjeta-bienvenida {
  transform: translateY(16px) scale(0.98);
}
</style>
