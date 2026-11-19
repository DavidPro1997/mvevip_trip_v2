<script setup>
import { computed } from 'vue';
import { ArrowRight, CalendarDays, Compass } from 'lucide-vue-next';
import { resumenReserva } from '@/services/reservas';
import { urlLocal } from '@/services/archivos';
import { fechaLarga } from '@/services/formato';
import { useContacto } from '@/composables/useContacto';

/** Tarjeta destacada del viaje que viene, con cuenta regresiva (o "disfruta tu viaje" si está en curso). */
const props = defineProps({
  proximo: { type: Object, default: null }, // { reserva, estado } de proximoViaje()
});
const { abrirEnlace } = useContacto();

const resumen = computed(() => (props.proximo ? resumenReserva(props.proximo.reserva) : null));
const estado = computed(() => props.proximo?.estado);

const cuenta = computed(() => {
  const e = estado.value;
  if (!e) return null;
  if (e.estado === 'proximo') return { numero: e.dias, texto: e.dias === 1 ? 'día para tu viaje' : 'días para tu viaje' };
  if (e.estado === 'hoy') return { numero: '¡Hoy!', texto: 'comienza tu viaje' };
  return { numero: null, texto: 'Disfruta tu viaje' };
});
</script>

<template>
  <article v-if="resumen" class="proximo">
    <div class="foto" :style="{ backgroundImage: `url('${urlLocal(resumen.imagen)}'), url('/img/headers/avion.jpg')` }">
      <span class="insignia insignia-marca">{{ estado.estado === 'en-curso' ? 'Viaje en curso' : 'Tu próximo viaje' }}</span>
    </div>

    <div class="cuerpo">
      <div class="cuenta">
        <span v-if="cuenta.numero !== null" class="numero">{{ cuenta.numero }}</span>
        <span class="cuenta-texto">{{ cuenta.texto }}</span>
      </div>

      <h3 class="destino">{{ resumen.titulo }}</h3>
      <p class="fecha">
        <CalendarDays :size="16" aria-hidden="true" />
        <span class="primera-mayuscula">{{ fechaLarga(estado.inicio) }}</span>
      </p>

      <RouterLink :to="{ name: 'reserva', params: { id: resumen.id } }" class="boton boton-marca ver">
        Ver mi viaje <ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>
    </div>
  </article>

  <article v-else class="proximo vacio">
    <span class="icono-vacio"><Compass :size="26" aria-hidden="true" /></span>
    <h3 class="destino">¿Listo para tu próxima aventura?</h3>
    <p class="fecha">No tienes viajes próximos. Descubre nuestros destinos y arma tu siguiente viaje.</p>
    <button type="button" class="boton boton-marca ver" @click="abrirEnlace('https://www.mvevip.com/listaCatalogos')">
      Ver destinos <ArrowRight :size="18" aria-hidden="true" />
    </button>
  </article>
</template>

<style scoped>
.proximo {
  overflow: hidden;
  border-radius: var(--radio-xl);
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.foto {
  position: relative;
  aspect-ratio: 16 / 8;
  background-color: var(--tinta-2);
  background-size: cover;
  background-position: center;
}

.foto .insignia {
  position: absolute;
  top: 16px;
  left: 16px;
}

.cuerpo {
  padding: 20px 22px 22px;
}

.cuenta {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.numero {
  font-family: var(--fuente-titulos);
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--tinta);
  font-variant-numeric: tabular-nums;
}

.cuenta-texto {
  color: var(--marca-oscura);
  font-weight: 700;
}

.destino {
  margin-top: 12px;
  font-size: 1.35rem;
  font-weight: 750;
}

.fecha {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: var(--texto-2);
  font-size: 0.92rem;
}

.primera-mayuscula::first-letter {
  text-transform: uppercase;
}

.ver {
  width: 100%;
  margin-top: 20px;
}

.vacio {
  padding: 28px 24px;
}

.vacio .fecha {
  display: block;
}

.icono-vacio {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--marca-suave);
  color: var(--marca-oscura);
}
</style>
