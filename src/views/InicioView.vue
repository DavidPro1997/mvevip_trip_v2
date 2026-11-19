<script>
// La bienvenida personalizada sale una vez cada vez que se abre la app (como antes)
let bienvenidaMostrada = false;
</script>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { FileText, Luggage, MapPin, MapPinned, Plane } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import {
  actividadesOrdenadas, clasificarDocumentos, destinosDe, idDeReserva, ordenarReservas, personalizacionDe, proximoViaje,
} from '@/services/reservas';
import { urlLocal } from '@/services/archivos';
import { nombrePropio } from '@/services/formato';
import { IMAGEN_PORTADA_INICIO } from '@/services/config';
import TarjetaReserva from '@/components/TarjetaReserva.vue';
import TarjetaProximoViaje from '@/components/TarjetaProximoViaje.vue';
import CarruselComplementos from '@/components/CarruselComplementos.vue';
import EnlacesMvevip from '@/components/EnlacesMvevip.vue';
import EstadoGuardado from '@/components/EstadoGuardado.vue';
import ModalBienvenida from '@/components/ModalBienvenida.vue';

const sesion = useSesionStore();

const primerNombre = computed(() => nombrePropio(String(sesion.usuario?.nombres ?? '').trim().split(/\s+/)[0]) || 'viajero');

const viajes = computed(() => ordenarReservas(sesion.reservas));
const proximo = computed(() => proximoViaje(sesion.reservas));
const cantidadProximos = computed(() => viajes.value.filter((v) => v.estado.estado !== 'realizado').length);

// Resumen con color de todo lo que tiene en sus viajes
const indicadores = computed(() => {
  const reservas = sesion.reservas;
  const documentos = reservas.reduce((total, r) => total + Object.values(clasificarDocumentos(r, sesion.usuario)).flat().length, 0);
  const destinos = new Set(reservas.flatMap((r) => destinosDe(r).map((d) => String(d.ciudad ?? '').toLowerCase())).filter(Boolean)).size;
  const actividades = reservas.reduce((total, r) => total + actividadesOrdenadas(r).length, 0);
  return [
    { id: 'viajes', numero: cantidadProximos.value, texto: 'Por viajar', icono: Plane, color: 'marca' },
    { id: 'documentos', numero: documentos, texto: 'Documentos', icono: FileText, color: 'cielo' },
    { id: 'destinos', numero: destinos, texto: destinos === 1 ? 'Destino' : 'Destinos', icono: MapPin, color: 'ambar' },
    { id: 'actividades', numero: actividades, texto: 'Actividades', icono: MapPinned, color: 'coral' },
  ];
});

const saludo = computed(() => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
});

// Filtro de la lista de reservas (solo aparece si hay viajes por hacer y realizados)
const filtro = ref('todas');
const porViajar = computed(() => viajes.value.filter((v) => v.estado.estado !== 'realizado'));
const realizados = computed(() => viajes.value.filter((v) => v.estado.estado === 'realizado'));
const filtros = computed(() => [
  { id: 'todas', texto: 'Todas', cantidad: viajes.value.length },
  { id: 'porViajar', texto: 'Por viajar', cantidad: porViajar.value.length },
  { id: 'realizados', texto: 'Realizados', cantidad: realizados.value.length },
]);
const conFiltros = computed(() => porViajar.value.length > 0 && realizados.value.length > 0);
const viajesFiltrados = computed(() => {
  if (filtro.value === 'porViajar') return porViajar.value;
  if (filtro.value === 'realizados') return realizados.value;
  return viajes.value;
});

// Actividades y servicios del inicio: los del próximo viaje (si no hay, la última reserva, como antes)
const reservaComplementos = computed(() => idDeReserva(proximo.value?.reserva ?? sesion.reservas.at(-1)));

const personalizacion = computed(() => personalizacionDe(sesion.reservas));
const verBienvenida = ref(false);
onMounted(() => {
  if (personalizacion.value && !bienvenidaMostrada) {
    bienvenidaMostrada = true;
    setTimeout(() => (verBienvenida.value = true), 400);
  }
});
</script>

<template>
  <main class="inicio">
    <!-- Portada -->
    <section class="portada" :style="{ backgroundImage: `url('${urlLocal(IMAGEN_PORTADA_INICIO)}'), url('/img/headers/avion.jpg')` }">
      <div class="portada-velo"></div>

      <div class="contenedor portada-rejilla">
        <div class="bienvenida aparecer">
          <p class="saludo">{{ saludo }},</p>
          <h1 class="nombre">{{ primerNombre }}</h1>
          <p class="lema">
            {{ cantidadProximos ? 'Todo lo que necesitas para tu viaje, en un solo lugar.' : 'Tus documentos y reservas, siempre contigo.' }}
          </p>

          <ul class="indicadores">
            <li v-for="ind in indicadores" :key="ind.id" class="indicador" :class="ind.color">
              <span class="indicador-icono"><component :is="ind.icono" :size="18" aria-hidden="true" /></span>
              <span class="indicador-numero">{{ ind.numero }}</span>
              <span class="indicador-texto">{{ ind.texto }}</span>
            </li>
          </ul>

          <EstadoGuardado class="estado" />
        </div>

        <TarjetaProximoViaje class="destacado aparecer" :proximo="proximo" />
      </div>
    </section>

    <!-- Mis viajes: panel blanco montado sobre la portada -->
    <div class="contenedor">
      <section class="panel" aria-labelledby="titulo-reservas">
        <div class="panel-cabeza">
          <div>
            <p class="antetitulo">Mis viajes</p>
            <h2 id="titulo-reservas" class="panel-titulo">
              Tus reservas <span v-if="viajes.length" class="total">{{ viajes.length }}</span>
            </h2>
          </div>

          <div v-if="conFiltros" class="filtros" role="tablist" aria-label="Filtrar reservas">
            <button
              v-for="f in filtros"
              :key="f.id"
              type="button"
              role="tab"
              class="filtro"
              :class="{ activo: filtro === f.id }"
              :aria-selected="filtro === f.id"
              @click="filtro = f.id"
            >
              {{ f.texto }} <span class="filtro-cantidad">{{ f.cantidad }}</span>
            </button>
          </div>
        </div>

        <div v-if="viajes.length" class="viajes">
          <TarjetaReserva v-for="v in viajesFiltrados" :key="idDeReserva(v.reserva)" :reserva="v.reserva" :estado="v.estado" />
        </div>
        <div v-else class="vacio">
          <Luggage :size="28" aria-hidden="true" />
          <p>Aún no tienes reservas disponibles.</p>
        </div>
      </section>
    </div>

    <!-- Franja de color: actividades del destino -->
    <div class="banda">
      <div class="contenedor">
        <CarruselComplementos :id-reserva="reservaComplementos" />
      </div>
    </div>

    <div class="contenedor">
      <EnlacesMvevip class="descubre" />
    </div>

    <ModalBienvenida
      v-if="personalizacion"
      :abierto="verBienvenida"
      :nombre="primerNombre"
      :personalizacion="personalizacion"
      @cerrar="verBienvenida = false"
    />
  </main>
</template>

<style scoped>
/* ── Portada ── */
.portada {
  position: relative;
  overflow: hidden;
  background-color: var(--tinta);
  background-position: center 65%;
  background-size: cover;
  color: #fff;
  isolation: isolate;
}

.portada-velo {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(600px 300px at 0% 100%, rgb(154 195 28 / 30%), transparent 65%),
    linear-gradient(180deg, rgb(11 19 36 / 30%) 0%, rgb(11 19 36 / 45%) 40%, rgb(11 19 36 / 85%) 100%);
}

.portada-rejilla {
  display: grid;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 56px; /* espacio que tapa el panel de reservas */
}

.saludo {
  color: rgb(255 255 255 / 85%);
  font-size: 1.05rem;
  font-weight: 500;
}

.nombre {
  margin-top: 2px;
  font-size: clamp(2.6rem, 9vw, 4.4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
  text-shadow: 0 4px 30px rgb(0 0 0 / 25%);
}

.lema {
  max-width: 440px;
  margin-top: 12px;
  color: rgb(255 255 255 / 88%);
  font-size: 1.05rem;
}

/* ── Indicadores de colores ── */
.indicadores {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.indicador {
  --c: var(--marca);
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 18px;
  background: rgb(255 255 255 / 10%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.indicador.marca { --c: var(--marca-viva); }
.indicador.cielo { --c: #38bdf8; }
.indicador.ambar { --c: #fbbf24; }
.indicador.coral { --c: #fb7185; }

.indicador-icono {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: var(--c);
  color: var(--tinta);
}

.indicador-numero {
  font-family: var(--fuente-titulos);
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.1;
}

.indicador-texto {
  color: rgb(255 255 255 / 78%);
  font-size: 0.78rem;
  font-weight: 500;
}

.estado {
  margin-top: 22px;
}

.destacado {
  animation-delay: 0.08s;
}

/* ── Panel de reservas (sube sobre la portada) ── */
.panel {
  position: relative;
  z-index: 2;
  margin-top: -32px;
  padding: 18px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-xl);
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.panel-cabeza {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.total {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--marca);
  color: var(--tinta);
  font-size: 0.8rem;
  font-weight: 800;
}

.filtros {
  display: flex;
  gap: 4px;
  max-width: 100%;
  padding: 4px;
  overflow-x: auto;
  border-radius: 999px;
  background: var(--superficie-2);
  scrollbar-width: none;
}

.filtro {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--texto-2);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transicion), color var(--transicion);
}

.filtro.activo {
  background: var(--superficie);
  color: var(--texto);
  box-shadow: var(--sombra-1);
}

.filtro-cantidad {
  color: var(--suave);
  font-size: 0.75rem;
}

.viajes {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 20px;
  color: var(--suave);
  text-align: center;
}

/* ── Franja de actividades ── */
.banda {
  margin-top: 28px;
  padding: 28px 0 32px;
  background:
    radial-gradient(500px 260px at 100% 0%, rgb(56 189 248 / 16%), transparent 70%),
    radial-gradient(500px 260px at 0% 100%, rgb(154 195 28 / 22%), transparent 70%),
    linear-gradient(180deg, #f2f8e4, #eaf5fb);
}

.descubre {
  margin-top: 32px;
}

@media (min-width: 960px) {
  .portada {
    background-position: center 70%;
  }

  .portada-velo {
    background:
      radial-gradient(700px 360px at 0% 100%, rgb(154 195 28 / 30%), transparent 65%),
      linear-gradient(90deg, rgb(11 19 36 / 72%) 0%, rgb(11 19 36 / 32%) 50%, rgb(11 19 36 / 0%) 100%);
  }

  .portada-rejilla {
    grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    align-items: center;
    gap: 48px;
    padding-top: 44px;
    padding-bottom: 84px;
  }

  .indicadores {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-width: 620px;
  }

  .indicador {
    grid-template-columns: 1fr;
    row-gap: 6px;
  }

  .indicador-icono {
    grid-row: auto;
    width: 36px;
    height: 36px;
    border-radius: 12px;
  }

  .panel {
    margin-top: -48px;
    padding: 22px 24px 24px;
  }

  .banda {
    margin-top: 36px;
    padding: 36px 0 40px;
  }

  .descubre {
    margin-top: 44px;
  }
}
</style>
