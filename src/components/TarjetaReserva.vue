<script setup>
/** Tarjeta compacta de una reserva: foto a la izquierda y el resumen del viaje a la derecha. */
import { computed } from 'vue';
import { CalendarDays, ChevronRight, FileText, MapPin, Users } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { clasificarDocumentos, resumenReserva } from '@/services/reservas';
import { urlLocal } from '@/services/archivos';

const props = defineProps({
  reserva: { type: Object, required: true },
  estado: { type: Object, required: true }, // estadoViaje()
});
const sesion = useSesionStore();
const resumen = computed(() => resumenReserva(props.reserva));
const documentos = computed(() => Object.values(clasificarDocumentos(props.reserva, sesion.usuario)).flat().length);
const viajeros = computed(() => (Array.isArray(props.reserva.viajeros) ? props.reserva.viajeros.length : 0));
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const INSIGNIA = { proximo: 'insignia-marca', hoy: 'insignia-marca', 'en-curso': 'insignia-marca', realizado: 'insignia-gris' };
</script>

<template>
  <RouterLink :to="{ name: 'reserva', params: { id: resumen.id } }" class="viaje" :class="{ realizado: estado.estado === 'realizado' }">
    <span class="foto" :style="{ backgroundImage: `url('${urlLocal(resumen.imagen)}'), url('/img/headers/avion.jpg')` }"></span>

    <span class="cuerpo">
      <span class="arriba">
        <span v-if="estado.texto" class="insignia" :class="INSIGNIA[estado.estado]">{{ estado.texto }}</span>
        <span class="numero">Reserva #{{ resumen.id }}</span>
      </span>

      <span class="titulo">{{ resumen.titulo }}</span>
      <span v-if="resumen.fecha" class="fecha"><CalendarDays :size="14" aria-hidden="true" /> {{ resumen.fecha }}</span>

      <span class="datos">
        <span><MapPin :size="13" aria-hidden="true" /> {{ plural(resumen.ciudades.length, 'destino', 'destinos') }}</span>
        <span><FileText :size="13" aria-hidden="true" /> {{ plural(documentos, 'documento', 'documentos') }}</span>
        <span v-if="viajeros"><Users :size="13" aria-hidden="true" /> {{ plural(viajeros, 'viajero', 'viajeros') }}</span>
      </span>
    </span>

    <ChevronRight :size="20" class="flecha" aria-hidden="true" />
  </RouterLink>
</template>

<style scoped>
.viaje {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 10px;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
  color: var(--texto);
  transition: transform var(--transicion), box-shadow var(--transicion), border-color var(--transicion);
}

.viaje:hover {
  transform: translateY(-2px);
  border-color: transparent;
  box-shadow: var(--sombra-3);
}

.foto {
  width: 104px;
  min-height: 112px;
  border-radius: var(--radio-sm);
  background-color: var(--tinta-2);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.realizado .foto {
  filter: grayscale(0.6);
}

.cuerpo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 2px 0;
}

.arriba {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
}

.arriba .insignia {
  padding: 3px 9px;
  font-size: 0.7rem;
}

.numero {
  color: var(--suave);
  font-size: 0.75rem;
  font-weight: 600;
}

.titulo {
  display: -webkit-box;
  overflow: hidden;
  font-family: var(--fuente-titulos);
  font-size: 1.06rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.25;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fecha {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--texto-2);
  font-size: 0.85rem;
  font-weight: 500;
}

.datos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 4px;
  color: var(--suave);
  font-size: 0.76rem;
}

.datos > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.flecha {
  align-self: center;
  margin-right: 4px;
  color: var(--suave);
  flex-shrink: 0;
  transition: transform var(--transicion), color var(--transicion);
}

.viaje:hover .flecha {
  transform: translateX(3px);
  color: var(--marca-oscura);
}

@media (min-width: 640px) {
  .foto {
    width: 124px;
  }
}
</style>
