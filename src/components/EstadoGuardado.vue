<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CloudDownload, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { useActualizar } from '@/composables/useActualizar';
import { haceCuanto } from '@/services/formato';

/** "Actualizado hace X", botón para actualizar y avance del guardado para usar sin conexión. */
const sesion = useSesionStore();
const { actualizar } = useActualizar();

// Para que "hace X min" se refresque solo
const ahora = ref(new Date());
let reloj;
onMounted(() => (reloj = setInterval(() => (ahora.value = new Date()), 30000)));
onBeforeUnmount(() => clearInterval(reloj));

const guardando = computed(() => sesion.guardado.activo && sesion.guardado.total > 0);
const porcentaje = computed(() =>
  sesion.guardado.total ? Math.round((sesion.guardado.listos / sesion.guardado.total) * 100) : 0,
);
</script>

<template>
  <div class="estado">
    <div class="texto">
      <template v-if="guardando">
        <CloudDownload :size="16" aria-hidden="true" />
        <span>Guardando tus documentos para usarlos sin conexión · {{ porcentaje }}%</span>
      </template>
      <template v-else-if="sesion.actualizado">
        <ShieldCheck :size="16" class="ok" aria-hidden="true" />
        <span>Guardado para usar sin internet · {{ haceCuanto(sesion.actualizado, ahora) }}</span>
      </template>
      <span v-if="guardando" class="barra" aria-hidden="true"><span :style="{ width: `${porcentaje}%` }"></span></span>
    </div>
    <button type="button" class="actualizar" :disabled="sesion.actualizando" aria-label="Actualizar mis viajes" @click="actualizar">
      <RefreshCw :size="15" :class="{ girando: sesion.actualizando }" aria-hidden="true" />
      Actualizar
    </button>
  </div>
</template>

<style scoped>
.estado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.texto {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgb(255 255 255 / 10%);
  color: rgb(255 255 255 / 86%);
  font-size: 0.82rem;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.ok {
  color: var(--marca-viva);
  flex-shrink: 0;
}

.barra {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgb(255 255 255 / 12%);
}

.barra span {
  display: block;
  height: 100%;
  background: var(--marca-viva);
  transition: width 0.3s ease;
}

.actualizar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transicion);
}

.actualizar:hover {
  background: rgb(255 255 255 / 10%);
}

.actualizar:disabled {
  opacity: 0.6;
}
</style>
