<script setup>
import { computed, ref } from 'vue';
import { ArrowRight } from 'lucide-vue-next';
import { complementosDe, mensajeComplemento } from '@/services/complementos';
import { useContacto } from '@/composables/useContacto';
import ActividadesDestino from './ActividadesDestino.vue';

const props = defineProps({
  idReserva: { type: String, default: '' },
  titulo: { type: String, default: 'Complementa tu viaje' },
});
const { abrirWhatsApp } = useContacto();
const lista = computed(() => complementosDe(props.idReserva));
// Imágenes de otros sitios que no cargaron (sin internet y sin guardar): queda el fondo de color
const sinImagen = ref({});
</script>

<template>
  <div id="servicios" class="complementos">
    <!-- <section v-if="lista.length">
      <div class="seccion-cabeza">
        <div>
          <p class="antetitulo">Servicios complementarios</p>
          <h2 class="titulo-seccion">{{ titulo }}</h2>
        </div>
      </div>

      <div class="carrusel rejilla">
        <button
          v-for="item in lista"
          :key="item.id"
          type="button"
          class="complemento"
          @click="abrirWhatsApp(mensajeComplemento(item, idReserva))"
        >
          <span class="foto">
            <img
              v-if="!sinImagen[item.id]"
              :src="item.imagen"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="sinImagen = { ...sinImagen, [item.id]: true }"
            />
          </span>
          <span class="cuerpo">
            <span class="nombre">{{ item.titulo }}</span>
            <span class="detalle">{{ item.detalle }}</span>
            <span class="pedir">Solicitar <ArrowRight :size="15" aria-hidden="true" /></span>
          </span>
        </button>
      </div>
    </section> -->

    <!-- Actividades y tours del destino (las del cotizador) con buscador por ciudad -->
    <ActividadesDestino v-if="idReserva" :id-reserva="idReserva" />
  </div>
</template>

<style scoped>
.complemento {
  display: flex;
  flex-direction: column;
  width: 230px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
  text-align: left;
  cursor: pointer;
  transition: transform var(--transicion), box-shadow var(--transicion), border-color var(--transicion);
}

.complemento:hover {
  transform: translateY(-3px);
  border-color: transparent;
  box-shadow: var(--sombra-3);
}

.foto {
  display: block;
  height: 140px;
  overflow: hidden;
  background:
    radial-gradient(200px 120px at 100% 0%, rgb(154 195 28 / 35%), transparent 70%),
    linear-gradient(135deg, var(--tinta-3), var(--tinta));
}

.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.complemento:hover .foto img {
  transform: scale(1.06);
}

.cuerpo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  padding: 16px 18px 18px;
}

.nombre {
  font-family: var(--fuente-titulos);
  font-size: 1.02rem;
  font-weight: 700;
}

.detalle {
  color: var(--texto-2);
  font-size: 0.88rem;
}

.pedir {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 12px;
  color: var(--marca-oscura);
  font-size: 0.85rem;
  font-weight: 700;
}

@media (min-width: 1024px) {
  .rejilla {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    margin: 0;
    padding: 0;
    overflow: visible;
  }

  .complemento {
    width: auto;
  }
}
</style>
