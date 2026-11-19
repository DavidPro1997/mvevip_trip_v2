<script setup>
/** Diálogo de confirmación sencillo (hoja que sube desde abajo en el celular). */
defineProps({
  abierto: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  texto: { type: String, default: '' },
  confirmar: { type: String, default: 'Aceptar' },
  cancelar: { type: String, default: 'Cancelar' },
  peligro: { type: Boolean, default: false },
});
const emit = defineEmits(['confirmar', 'cerrar']);
</script>

<template>
  <Teleport to="body">
    <Transition name="dialogo">
      <div v-if="abierto" class="fondo" @click.self="emit('cerrar')" @keydown.esc="emit('cerrar')">
        <div class="hoja" role="alertdialog" aria-modal="true" :aria-label="titulo">
          <h2 class="titulo">{{ titulo }}</h2>
          <p v-if="texto" class="texto">{{ texto }}</p>
          <div class="acciones">
            <button type="button" class="boton boton-secundario" @click="emit('cerrar')">{{ cancelar }}</button>
            <button type="button" class="boton" :class="{ peligro }" @click="emit('confirmar')">{{ confirmar }}</button>
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
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(20 23 31 / 40%);
}

.hoja {
  width: 100%;
  max-width: 440px;
  margin: 12px;
  margin-bottom: calc(12px + var(--abajo-seguro));
  padding: 24px;
  border-radius: 24px;
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.titulo {
  font-size: 1.1rem;
  font-weight: 700;
}

.texto {
  margin-top: 6px;
  color: var(--texto-2);
}

.acciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 22px;
}

.peligro {
  background: var(--peligro);
}

@media (min-width: 600px) {
  .fondo {
    align-items: center;
  }
}

.dialogo-enter-active,
.dialogo-leave-active {
  transition: opacity 0.2s ease;
}

.dialogo-enter-active .hoja,
.dialogo-leave-active .hoja {
  transition: transform 0.25s ease;
}

.dialogo-enter-from,
.dialogo-leave-to {
  opacity: 0;
}

.dialogo-enter-from .hoja,
.dialogo-leave-to .hoja {
  transform: translateY(24px);
}
</style>
