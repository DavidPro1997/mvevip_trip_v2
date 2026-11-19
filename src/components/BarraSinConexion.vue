<script setup>
import { WifiOff } from 'lucide-vue-next';
import { useConexion } from '@/composables/useConexion';

const { enLinea } = useConexion();
</script>

<template>
  <Transition name="barra">
    <div v-if="!enLinea" class="barra" role="status">
      <WifiOff :size="16" aria-hidden="true" />
      <span>Sin conexión · estás viendo tu información guardada</span>
    </div>
  </Transition>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px var(--margen);
  background: var(--aviso-suave);
  color: var(--aviso);
  font-size: 0.82rem;
  font-weight: 600;
}

.barra-enter-active,
.barra-leave-active {
  transition: opacity 0.2s ease;
}

.barra-enter-from,
.barra-leave-to {
  opacity: 0;
}
</style>
