<script setup>
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft, CalendarDays, CloudSun, FileText, Headset, Hotel, MapPin, MapPinned, Plane, ShieldCheck, Smartphone, Ticket, UserRound,
} from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { useContacto } from '@/composables/useContacto';
import { actividadesOrdenadas, clasificarDocumentos, climaDe, estadoViaje, resumenReserva } from '@/services/reservas';
import { urlLocal } from '@/services/archivos';
import { fechaLarga } from '@/services/formato';
import ListaDocumentos from '@/components/ListaDocumentos.vue';
import LineaTiempo from '@/components/LineaTiempo.vue';
import PanelClima from '@/components/PanelClima.vue';
import CarruselComplementos from '@/components/CarruselComplementos.vue';

const props = defineProps({ id: { type: String, required: true } });

const sesion = useSesionStore();
const route = useRoute();
const router = useRouter();
const { abrirWhatsApp } = useContacto();

const reserva = computed(() => sesion.reservaPorId(props.id));
const resumen = computed(() => (reserva.value ? resumenReserva(reserva.value) : null));
const estado = computed(() => estadoViaje(reserva.value));
const documentos = computed(() => clasificarDocumentos(reserva.value, sesion.usuario));
const actividades = computed(() => actividadesOrdenadas(reserva.value));
const clima = computed(() => climaDe(reserva.value));

// Secciones en el orden del menú anterior; solo salen las que tienen algo
const SECCIONES = [
  { id: 'documentos', etiqueta: 'Documentos', titulo: 'Documentos de identidad', descripcion: 'Pasaportes, cédulas y visas de los viajeros.', icono: UserRound },
  { id: 'tickets', etiqueta: 'Tickets', titulo: 'Tickets aéreos', descripcion: 'Tus boletos de avión por tramo.', icono: Plane },
  { id: 'boarding', etiqueta: 'Boarding', titulo: 'Boarding pass', descripcion: 'Pases de abordar listos para presentar.', icono: Ticket },
  { id: 'seguro', etiqueta: 'Seguro', titulo: 'Seguro de viaje', descripcion: 'Tu cobertura durante el viaje.', icono: ShieldCheck },
  { id: 'sim', etiqueta: 'SIM', titulo: 'SIM de viaje', descripcion: 'Datos e instrucciones de tu SIM.', icono: Smartphone },
  { id: 'otro', etiqueta: 'Adicionales', titulo: 'Documentos adicionales', descripcion: 'Otros servicios de tu viaje.', icono: FileText },
  { id: 'hotel', etiqueta: 'Reserva', titulo: 'Tu reserva', descripcion: 'El documento completo de tu reserva.', icono: Hotel },
  { id: 'actividades', etiqueta: 'Itinerario', titulo: 'Itinerario', descripcion: 'Tus actividades, día por día.', icono: MapPinned },
  { id: 'clima', etiqueta: 'Clima', titulo: 'Clima del viaje', descripcion: 'Pronóstico y recomendaciones para cada destino.', icono: CloudSun },
];

const cantidad = (id) => {
  if (id === 'actividades') return actividades.value.length;
  if (id === 'clima') return clima.value.ubicaciones.length;
  return documentos.value[id]?.length ?? 0;
};
const secciones = computed(() => SECCIONES.filter((s) => cantidad(s.id) > 0));
const totalDocumentos = computed(() => Object.values(documentos.value).flat().length);

// La sección elegida va en la URL (?ver=tickets): al volver atrás se queda donde estaba
const activa = computed(() => secciones.value.find((s) => s.id === route.query.ver) ?? secciones.value[0] ?? null);
// Al cambiar de sección la página no se va arriba: si ya bajaste más allá del título, el título
// queda justo debajo de la cabecera (y las pestañas en el celular). La distancia la da scroll-margin-top.
const cabeza = ref(null);
async function elegir(id) {
  await router.replace({ query: { ...route.query, ver: id } });
  await nextTick();
  const titulo = cabeza.value;
  if (!titulo) return;
  // Solo si el título quedó escondido bajo las barras fijas (o más arriba)
  const margen = parseFloat(getComputedStyle(titulo).scrollMarginTop) || 0;
  if (titulo.getBoundingClientRect().top < margen) titulo.scrollIntoView({ block: 'start' });
}
</script>

<template>
  <main v-if="reserva" class="reserva">
    <!-- Portada -->
    <section class="portada">
      <div class="portada-foto" :style="{ backgroundImage: `url('${urlLocal(resumen.imagenPortada)}'), url('/img/headers/avion.jpg')` }"></div>
      <div class="portada-velo"></div>
      <div class="contenedor portada-contenido">
        <RouterLink :to="{ name: 'inicio' }" class="volver">
          <ArrowLeft :size="18" aria-hidden="true" /> Mis viajes
        </RouterLink>

        <div class="portada-textos aparecer">
          <span v-if="estado.texto" class="insignia" :class="estado.estado === 'realizado' ? 'insignia-clara' : 'insignia-marca'">{{ estado.texto }}</span>
          <h1 class="titulo">{{ resumen.titulo }}</h1>
          <div class="datos">
            <span v-if="estado.inicio" class="dato"><CalendarDays :size="16" aria-hidden="true" /> <span class="mayuscula">{{ fechaLarga(estado.inicio) }}</span></span>
            <span class="dato"><MapPin :size="16" aria-hidden="true" /> {{ resumen.ciudades.length }} {{ resumen.ciudades.length === 1 ? 'destino' : 'destinos' }}</span>
            <span class="dato"><FileText :size="16" aria-hidden="true" /> {{ totalDocumentos }} {{ totalDocumentos === 1 ? 'documento' : 'documentos' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Pestañas (celular y tablet) -->
    <nav v-if="secciones.length" class="pestanas" aria-label="Secciones de la reserva">
      <div class="contenedor">
        <div class="carrusel fila" role="tablist">
          <button
            v-for="s in secciones"
            :key="s.id"
            type="button"
            role="tab"
            class="pestana"
            :class="{ activa: activa?.id === s.id }"
            :aria-selected="activa?.id === s.id"
            @click="elegir(s.id)"
          >
            <component :is="s.icono" :size="17" aria-hidden="true" />
            {{ s.etiqueta }}
          </button>
        </div>
      </div>
    </nav>

    <div class="contenedor detalle">
      <!-- Menú lateral (PC) -->
      <aside v-if="secciones.length" class="lateral">
        <nav class="tarjeta menu" aria-label="Secciones de la reserva">
          <p class="menu-titulo">Tu viaje</p>
          <button
            v-for="s in secciones"
            :key="s.id"
            type="button"
            class="menu-opcion"
            :class="{ activa: activa?.id === s.id }"
            :aria-current="activa?.id === s.id ? 'page' : undefined"
            @click="elegir(s.id)"
          >
            <span class="menu-icono"><component :is="s.icono" :size="18" aria-hidden="true" /></span>
            <span class="menu-etiqueta">{{ s.etiqueta }}</span>
            <span class="menu-cantidad">{{ cantidad(s.id) }}</span>
          </button>
        </nav>

        <div class="ayuda">
          <span class="ayuda-icono"><Headset :size="20" aria-hidden="true" /></span>
          <p class="ayuda-titulo">¿Necesitas ayuda?</p>
          <p class="ayuda-texto">Tu asesor te acompaña antes y durante el viaje.</p>
          <button type="button" class="boton boton-marca" @click="abrirWhatsApp(`Hola, necesito ayuda con mi reserva ${id}.`)">
            Escribir por WhatsApp
          </button>
        </div>
      </aside>

      <!-- Contenido -->
      <section class="contenido">
        <template v-if="activa">
          <header ref="cabeza" class="contenido-cabeza">
            <h2 class="titulo-seccion">{{ activa.titulo }}</h2>
            <p class="texto-suave">{{ activa.descripcion }}</p>
          </header>
          <LineaTiempo v-if="activa.id === 'actividades'" :actividades="actividades" />
          <PanelClima v-else-if="activa.id === 'clima'" :id-reserva="id" :clima="clima" />
          <ListaDocumentos v-else :key="activa.id" :documentos="documentos[activa.id]" :icono="activa.icono" />
        </template>
        <div v-else class="tarjeta vacio">
          <FileText :size="30" aria-hidden="true" />
          <p class="vacio-titulo">Tus documentos están en preparación</p>
          <p class="texto-suave">Te avisaremos cuando estén listos. Mientras tanto, tu asesor puede ayudarte con cualquier duda.</p>
        </div>
      </section>
    </div>

    <div class="contenedor">
      <CarruselComplementos class="seccion" :id-reserva="id" titulo="Haz tu viaje aún mejor" />
    </div>
  </main>

  <main v-else class="contenedor no-encontrada">
    <h1 class="titulo-seccion">No encontramos este viaje</h1>
    <p class="texto-suave">Puede que ya no esté disponible en tu cuenta.</p>
    <RouterLink :to="{ name: 'inicio' }" class="boton">Ver mis viajes</RouterLink>
  </main>
</template>

<style scoped>
/* ── Portada ── */
.portada {
  position: relative;
  overflow: hidden;
  background: var(--tinta);
  color: #fff;
  isolation: isolate;
}

.portada-foto {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-size: cover;
  background-position: center;
}

.portada-velo {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgb(11 19 36 / 35%) 0%, rgb(11 19 36 / 15%) 35%, rgb(11 19 36 / 90%) 100%);
}

.portada-contenido {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
  padding-top: 20px;
  padding-bottom: 28px;
}

.volver {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  height: 40px;
  padding: 0 16px 0 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 16%);
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(12px);
  transition: background var(--transicion);
}

.volver:hover {
  background: rgb(255 255 255 / 26%);
}

.titulo {
  margin-top: 12px;
  font-size: clamp(2rem, 6vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.02;
}

.datos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 14px;
  color: rgb(255 255 255 / 85%);
  font-size: 0.9rem;
}

.dato {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mayuscula::first-letter {
  text-transform: uppercase;
}

/* ── Pestañas (móvil) ── */
.pestanas {
  position: sticky;
  top: var(--alto-arriba, var(--alto-cabecera));
  z-index: 20;
  background: rgb(243 245 248 / 90%);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-bottom: 1px solid var(--borde);
}

.fila {
  gap: 8px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.pestana {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--borde);
  border-radius: 999px;
  background: var(--superficie);
  color: var(--texto-2);
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.pestana.activa {
  border-color: var(--tinta);
  background: var(--tinta);
  color: #fff;
}

/* ── Detalle ── */
.detalle {
  padding-top: 28px;
}

.lateral {
  display: none;
}

.contenido {
  min-width: 0;
}

.contenido-cabeza {
  margin-bottom: 20px;
  /* cabecera + barra de pestañas (61px) + aire */
  scroll-margin-top: calc(var(--alto-arriba, var(--alto-cabecera)) + 61px + 16px);
}

.contenido-cabeza .texto-suave {
  margin-top: 4px;
  font-size: 0.95rem;
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--suave);
  text-align: center;
}

.vacio-titulo {
  color: var(--texto);
  font-weight: 650;
}

.no-encontrada {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 96px;
  padding-bottom: 48px;
  text-align: center;
}

/* ── PC: menú lateral ── */
@media (min-width: 1024px) {
  .portada-contenido {
    min-height: 420px;
    padding-top: 28px;
    padding-bottom: 48px;
  }

  .pestanas {
    display: none;
  }

  .contenido-cabeza {
    scroll-margin-top: calc(var(--alto-arriba, var(--alto-cabecera)) + 24px);
  }

  .detalle {
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr);
    align-items: start;
    gap: 40px;
    padding-top: 40px;
  }

  .lateral {
    position: sticky;
    top: calc(var(--alto-arriba, var(--alto-cabecera)) + 24px);
    display: grid;
    gap: 16px;
  }

  .menu {
    padding: 10px;
  }

  .menu-titulo {
    padding: 10px 12px 8px;
    color: var(--suave);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .menu-opcion {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 9px 10px;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: var(--texto-2);
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: background var(--transicion), color var(--transicion);
  }

  .menu-opcion:hover {
    background: var(--superficie-2);
    color: var(--texto);
  }

  .menu-opcion.activa {
    background: var(--tinta);
    color: #fff;
  }

  .menu-icono {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: var(--superficie-2);
    color: var(--texto-2);
    flex-shrink: 0;
  }

  .menu-opcion.activa .menu-icono {
    background: var(--marca);
    color: var(--tinta);
  }

  .menu-etiqueta {
    flex: 1;
  }

  .menu-cantidad {
    min-width: 26px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--superficie-2);
    color: var(--texto-2);
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
  }

  .menu-opcion.activa .menu-cantidad {
    background: rgb(255 255 255 / 14%);
    color: #fff;
  }

  .ayuda {
    padding: 22px;
    border-radius: var(--radio);
    background:
      radial-gradient(300px 160px at 100% 0%, rgb(154 195 28 / 30%), transparent 70%),
      var(--tinta);
    color: #fff;
  }

  .ayuda-icono {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: rgb(255 255 255 / 10%);
    color: var(--marca-viva);
  }

  .ayuda-titulo {
    margin-top: 14px;
    font-family: var(--fuente-titulos);
    font-size: 1.05rem;
    font-weight: 700;
  }

  .ayuda-texto {
    margin-top: 4px;
    color: rgb(255 255 255 / 70%);
    font-size: 0.88rem;
  }

  .ayuda .boton {
    width: 100%;
    margin-top: 16px;
    min-height: 44px;
  }
}
</style>
