<script setup>
import { computed, ref } from 'vue';
import { Building2, MapPin, Paperclip, StickyNote } from 'lucide-vue-next';
import { agruparPorDia } from '@/services/actividades';
import { nombrePropio } from '@/services/formato';

/** Itinerario por días (port de renderTimeline) */
const props = defineProps({ actividades: { type: Array, required: true } });
const dias = computed(() => agruparPorDia(props.actividades));

// Descripciones largas se recortan; "Ver más" las abre
const abiertas = ref(new Set());
const alternar = (id) => {
  const copia = new Set(abiertas.value);
  copia.has(id) ? copia.delete(id) : copia.add(id);
  abiertas.value = copia;
};
const LARGO_DESCRIPCION = 220;
</script>

<template>
  <ol class="linea">
    <li v-for="dia in dias" :key="dia.clave" class="dia">
      <div class="marca" aria-hidden="true">D{{ dia.numero }}</div>
      <div class="contenido">
        <h3 class="fecha">{{ dia.etiqueta }}</h3>
        <ul class="actividades">
          <li v-for="act in dia.actividades" :key="act.id" class="tarjeta actividad">
            <div class="cabeza">
              <img v-if="act.imagen" :src="act.imagen" alt="" class="foto" loading="lazy" />
              <div class="cabeza-textos">
                <span v-if="act.hora" class="hora">{{ act.hora }}</span>
                <p class="nombre">{{ act.nombre || 'Actividad' }}</p>
              </div>
            </div>

            <p v-if="act.ciudad" class="dato"><MapPin :size="14" aria-hidden="true" /> {{ nombrePropio(act.ciudad) }}</p>

            <p v-if="act.descripcion" class="descripcion">
              {{
                abiertas.has(act.id) || act.descripcion.length <= LARGO_DESCRIPCION
                  ? act.descripcion
                  : `${act.descripcion.slice(0, LARGO_DESCRIPCION - 3).trimEnd()}…`
              }}
              <button v-if="act.descripcion.length > LARGO_DESCRIPCION" type="button" class="ver-mas" @click="alternar(act.id)">
                {{ abiertas.has(act.id) ? 'Ver menos' : 'Ver más' }}
              </button>
            </p>

            <p v-if="act.indicaciones" class="indicaciones"><StickyNote :size="14" aria-hidden="true" /> {{ act.indicaciones }}</p>
            <p v-if="act.proveedor" class="dato"><Building2 :size="14" aria-hidden="true" /> {{ act.proveedor }}</p>
            <p v-if="act.documentos" class="dato">
              <Paperclip :size="14" aria-hidden="true" /> {{ act.documentos }} documento{{ act.documentos > 1 ? 's' : '' }}
            </p>
          </li>
        </ul>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.linea {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}

.linea::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 19px;
  width: 2px;
  background: linear-gradient(var(--marca), var(--borde));
  border-radius: 2px;
}

.dia {
  position: relative;
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
}

.marca {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--superficie);
  border: 2px solid var(--marca);
  color: var(--marca-oscura);
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
}

.contenido {
  flex: 1;
  min-width: 0;
  padding-top: 8px;
}

.fecha {
  margin-bottom: 10px;
  font-size: 0.95rem;
  font-weight: 700;
}

.fecha::first-letter {
  text-transform: uppercase;
}

.actividades {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.actividad {
  padding: 14px 16px;
}

.cabeza {
  display: flex;
  align-items: center;
  gap: 12px;
}

.foto {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.cabeza-textos {
  min-width: 0;
}

.hora {
  display: inline-block;
  margin-bottom: 2px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--marca-suave);
  color: var(--marca-oscura);
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.nombre {
  font-weight: 700;
  line-height: 1.3;
}

.dato {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--texto-2);
  font-size: 0.85rem;
}

.descripcion {
  margin-top: 10px;
  color: var(--texto-2);
  font-size: 0.9rem;
  line-height: 1.55;
}

.ver-mas {
  padding: 0;
  border: 0;
  background: none;
  color: var(--marca-oscura);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.indicaciones {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--superficie-2);
  color: var(--texto-2);
  font-size: 0.85rem;
}

.indicaciones svg {
  flex-shrink: 0;
  margin-top: 3px;
}
</style>
