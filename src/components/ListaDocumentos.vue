<script setup>
import { ref, watch } from 'vue';
import { ArrowUpRight, CircleCheck, FileText } from 'lucide-vue-next';
import { estaGuardado } from '@/services/archivos';
import { nombrePropio } from '@/services/formato';
import { useSesionStore } from '@/stores/sesion';
import VisorPdf from './VisorPdf.vue';

const props = defineProps({
  documentos: { type: Array, required: true },
  icono: { type: [Object, Function], default: () => FileText },
});

const sesion = useSesionStore();
const abierto = ref(null);
// url → true si el PDF ya está en el dispositivo (se revisa otra vez al terminar de guardar)
const guardados = ref({});

async function revisarGuardados() {
  const lista = await Promise.all(props.documentos.map(async (d) => [d.url, await estaGuardado(d.url)]));
  guardados.value = Object.fromEntries(lista);
}

watch(() => [props.documentos, sesion.guardado.activo, abierto.value], revisarGuardados, { immediate: true });

// "Pasaporte - ANA PÉREZ" → título "Pasaporte" y detalle "ANA PÉREZ"
const partes = (titulo) => {
  const i = String(titulo).lastIndexOf(' - ');
  return i > 0 ? [titulo.slice(0, i), titulo.slice(i + 3)] : [titulo, ''];
};
</script>

<template>
  <ul class="documentos">
    <li v-for="doc in documentos" :key="doc.url">
      <button type="button" class="documento" @click="abierto = doc">
        <span class="icono"><component :is="icono" :size="22" aria-hidden="true" /></span>
        <span class="textos">
          <span class="titulo">{{ partes(doc.titulo)[0] }}</span>
          <span v-if="partes(doc.titulo)[1]" class="detalle">{{ nombrePropio(partes(doc.titulo)[1]) }}</span>
          <span class="estado" :class="{ guardado: guardados[doc.url] }">
            <template v-if="guardados[doc.url]"><CircleCheck :size="13" aria-hidden="true" /> Disponible sin conexión</template>
            <template v-else>PDF</template>
          </span>
        </span>
        <span class="abrir"><span class="abrir-texto">Ver</span> <ArrowUpRight :size="16" aria-hidden="true" /></span>
      </button>
    </li>
  </ul>

  <VisorPdf v-if="abierto" :documento="abierto" @cerrar="abierto = null" />
</template>

<style scoped>
.documentos {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.documento {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
  text-align: left;
  cursor: pointer;
  transition: transform var(--transicion), box-shadow var(--transicion), border-color var(--transicion);
}

.documento:hover {
  transform: translateY(-2px);
  border-color: transparent;
  box-shadow: var(--sombra-2);
}

.icono {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--tinta);
  color: var(--marca-viva);
  flex-shrink: 0;
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.titulo {
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.detalle {
  color: var(--texto-2);
  font-size: 0.88rem;
  overflow-wrap: anywhere;
}

.estado {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  color: var(--suave);
  font-size: 0.78rem;
  font-weight: 600;
}

.estado.guardado {
  color: var(--marca-oscura);
}

.abrir {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--superficie-2);
  font-size: 0.85rem;
  font-weight: 650;
  flex-shrink: 0;
  transition: background var(--transicion), color var(--transicion);
}

.documento:hover .abrir {
  background: var(--tinta);
  color: #fff;
}

@media (max-width: 479px) {
  .documento {
    gap: 12px;
    padding: 14px;
  }

  .icono {
    width: 46px;
    height: 46px;
    border-radius: 14px;
  }

  .abrir {
    width: 36px;
    padding: 0;
    justify-content: center;
  }

  .abrir-texto {
    display: none;
  }
}

@media (min-width: 1200px) {
  .documentos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
