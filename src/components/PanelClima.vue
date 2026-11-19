<script setup>
import { computed, onMounted, ref } from 'vue';
import { Lightbulb, LoaderCircle, MapPin } from 'lucide-vue-next';
import { climaGuardado, consultarClima } from '@/services/clima';
import { useSesionStore } from '@/stores/sesion';
import { useConexion } from '@/composables/useConexion';
import { haceCuanto } from '@/services/formato';

/** Clima del viaje: pronóstico por ubicación, días seleccionables y recomendaciones (port de renderClima). */
const props = defineProps({
  idReserva: { type: String, required: true },
  clima: { type: Object, required: true }, // { ubicaciones, tipos }
});

const sesion = useSesionStore();
const { enLinea } = useConexion();

const datos = ref(climaGuardado(props.idReserva));
const cargando = ref(false);
const fallo = ref(false);
const diaElegido = ref({}); // índice de lugar → índice de día

onMounted(async () => {
  if (!enLinea.value) return;
  cargando.value = true;
  try {
    datos.value = await consultarClima(props.idReserva, props.clima, sesion.token);
    fallo.value = false;
  } catch (e) {
    console.warn('No se pudo consultar el clima', e);
    fallo.value = true;
  } finally {
    cargando.value = false;
  }
});

const nombresTipo = computed(() =>
  Object.fromEntries((props.clima.tipos ?? []).map((t) => [t.id, t.nombre || t.tipo || `Tipo ${t.id}`])),
);
const dia = (iLugar) => datos.value.lugares[iLugar].dias[diaElegido.value[iLugar] ?? 0];
const fechaDe = (iso) => new Date(`${iso}T12:00:00`);
const temperatura = (t) => (t === null || t === undefined ? '--' : `${Math.round(t)}°`);
</script>

<template>
  <div class="clima">
    <div v-if="cargando && !datos" class="mensaje">
      <LoaderCircle :size="26" class="girando" aria-hidden="true" />
      <p>Consultando el clima…</p>
    </div>

    <div v-else-if="!datos" class="tarjeta mensaje">
      <p v-if="!enLinea">Sin conexión. El clima se muestra cuando tengas internet.</p>
      <p v-else>No se pudo cargar el clima. Intenta más tarde.</p>
    </div>

    <template v-else>
      <p class="nota">
        <template v-if="cargando">Actualizando…</template>
        <template v-else-if="!enLinea || fallo">Pronóstico guardado {{ haceCuanto(datos.actualizado) }}</template>
      </p>

      <article v-for="(lugar, iLugar) in datos.lugares" :key="iLugar" class="tarjeta lugar">
        <h3 class="ciudad"><MapPin :size="16" aria-hidden="true" /> {{ lugar.ciudad }}</h3>

        <div class="carrusel dias" role="tablist" :aria-label="`Días en ${lugar.ciudad}`">
          <button
            v-for="(d, iDia) in lugar.dias"
            :key="d.fecha"
            type="button"
            role="tab"
            class="dia"
            :class="{ activo: (diaElegido[iLugar] ?? 0) === iDia }"
            :aria-selected="(diaElegido[iLugar] ?? 0) === iDia"
            @click="diaElegido = { ...diaElegido, [iLugar]: iDia }"
          >
            <span class="emoji">{{ d.emoji }}</span>
            <span class="dia-nombre">{{ fechaDe(d.fecha).toLocaleDateString('es', { weekday: 'short' }) }} {{ fechaDe(d.fecha).getDate() }}</span>
            <span class="max">{{ temperatura(d.tempMax) }}</span>
            <span class="min">{{ temperatura(d.tempMin) }}</span>
          </button>
        </div>

        <div v-if="lugar.dias.length" class="detalle">
          <div class="detalle-cabeza">
            <span class="detalle-emoji">{{ dia(iLugar).emoji }}</span>
            <div>
              <p class="detalle-fecha">{{ fechaDe(dia(iLugar).fecha).toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: 'long' }) }}</p>
              <p class="detalle-temp">
                {{ temperatura(dia(iLugar).tempMax) }}C <span class="texto-suave">mín {{ temperatura(dia(iLugar).tempMin) }}C</span>
              </p>
            </div>
            <span class="tipo">{{ nombresTipo[dia(iLugar).climaId] || dia(iLugar).nombre }}</span>
          </div>

          <div v-if="datos.recomendaciones[dia(iLugar).climaId]?.length" class="recomendaciones">
            <p class="recomendaciones-titulo"><Lightbulb :size="15" aria-hidden="true" /> Recomendaciones</p>
            <ul>
              <li v-for="rec in datos.recomendaciones[dia(iLugar).climaId]" :key="rec">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>

<style scoped>
.mensaje {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 20px;
  color: var(--texto-2);
  text-align: center;
}

.nota {
  min-height: 1em;
  margin-bottom: 8px;
  color: var(--suave);
  font-size: 0.8rem;
}

.lugar {
  padding: 16px 16px 18px;
  margin-bottom: 16px;
  overflow: hidden;
}

.ciudad {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  font-weight: 700;
}

.dias {
  gap: 8px;
  margin-top: 12px;
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
}

.dia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 62px;
  padding: 10px 6px;
  border: 1px solid var(--borde);
  border-radius: 14px;
  background: var(--superficie);
  cursor: pointer;
}

.dia.activo {
  border-color: var(--texto);
  background: var(--texto);
  color: #fff;
}

.emoji {
  font-size: 1.3rem;
  line-height: 1.2;
}

.dia-nombre {
  font-size: 0.72rem;
  text-transform: capitalize;
}

.max {
  font-size: 0.85rem;
  font-weight: 700;
}

.min {
  font-size: 0.72rem;
  opacity: 0.65;
}

.detalle {
  margin-top: 14px;
  padding: 16px;
  border-radius: 14px;
  background: var(--superficie-2);
}

.detalle-cabeza {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detalle-emoji {
  font-size: 2.6rem;
  line-height: 1;
}

.detalle-fecha {
  color: var(--texto-2);
  font-size: 0.82rem;
}

.detalle-fecha::first-letter {
  text-transform: uppercase;
}

.detalle-temp {
  font-size: 1.6rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.detalle-temp .texto-suave {
  font-size: 0.85rem;
  font-weight: 500;
}

.tipo {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--superficie);
  font-size: 0.75rem;
  font-weight: 650;
  text-align: center;
}

.recomendaciones {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--borde);
}

.recomendaciones-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 700;
}

.recomendaciones ul {
  margin: 0;
  padding-left: 20px;
  color: var(--texto-2);
  font-size: 0.88rem;
}

.recomendaciones li + li {
  margin-top: 4px;
}
</style>
