<script setup>
import { Music, Pause } from 'lucide-vue-next';
import { useMusica } from '@/composables/useMusica';

const { hayMusica, sonando, alternar } = useMusica();
</script>

<template>
  <button
    v-if="hayMusica"
    type="button"
    class="boton-musica"
    :class="{ sonando }"
    :aria-label="sonando ? 'Pausar música' : 'Reproducir música'"
    :title="sonando ? 'Pausar música' : 'Reproducir música'"
    @click="alternar"
  >
    <Pause v-if="sonando" :size="20" />
    <Music v-else :size="20" />
  </button>
</template>

<style scoped>
.boton-musica {
  position: fixed;
  right: 16px;
  bottom: calc(84px + var(--abajo-seguro));
  z-index: 35;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 999px;
  background: var(--superficie);
  color: var(--texto);
  box-shadow: var(--sombra-3);
  cursor: pointer;
}

.sonando {
  background: var(--marca);
  color: #fff;
}
</style>
