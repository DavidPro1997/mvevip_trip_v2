<script setup>
import { AlertCircle, CheckCircle2, Info, WifiOff, X } from 'lucide-vue-next';
import { useAvisos } from '@/composables/useAvisos';

const { avisos, quitar } = useAvisos();
const ICONOS = { info: Info, exito: CheckCircle2, error: AlertCircle, sinConexion: WifiOff };
</script>

<template>
  <div class="avisos" aria-live="polite">
    <TransitionGroup name="aviso">
      <div v-for="aviso in avisos" :key="aviso.id" class="aviso" :class="aviso.tipo" role="status">
        <component :is="ICONOS[aviso.tipo] ?? Info" :size="18" class="icono" aria-hidden="true" />
        <span class="texto">{{ aviso.texto }}</span>
        <button type="button" class="cerrar" aria-label="Cerrar aviso" @click="quitar(aviso.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.avisos {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(16px + var(--abajo-seguro));
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  pointer-events: none;
}

.aviso {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 460px;
  padding: 12px 10px 12px 16px;
  border-radius: 16px;
  background: var(--texto);
  color: #fff;
  box-shadow: var(--sombra-3);
  font-size: 0.9rem;
  pointer-events: auto;
}

.icono {
  flex-shrink: 0;
}

.exito .icono {
  color: var(--marca);
}

.error .icono {
  color: #ff8a8a;
}

.sinConexion .icono {
  color: #ffc56b;
}

.texto {
  flex: 1;
}

.cerrar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(255 255 255 / 70%);
  cursor: pointer;
}

.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
