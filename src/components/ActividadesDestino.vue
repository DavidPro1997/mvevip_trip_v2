<script setup>
/**
 * Actividades y tours para complementar el viaje (las mismas del cotizador: visibles y con precio).
 * Primero se sugieren 5 del destino de la reserva; con el buscador se eligen otras ciudades.
 * "Solicitar" manda un mini detalle por WhatsApp. Las sugeridas quedan guardadas para verlas sin internet.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ArrowRight, Info, LoaderCircle, MapPin, Search, Users, X } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { useConexion } from '@/composables/useConexion';
import { useContacto } from '@/composables/useContacto';
import { actividadesDeCiudades, buscarCiudadesConActividades, SinConexionError } from '@/services/api';
import { LLAVES, guardar, leer } from '@/services/almacenamiento';
import { urlLocal } from '@/services/archivos';
import { nombrePropio } from '@/services/formato';
import {
  POR_PAGINA, ciudadDe, codigosDeReserva, mensajeActividad, precioDesde, preciosDe, textoPasajeros,
} from '@/services/ofertaActividades';

const props = defineProps({ idReserva: { type: String, default: '' } });

const sesion = useSesionStore();
const { enLinea } = useConexion();
const { abrirWhatsApp } = useContacto();

const reserva = computed(() => sesion.reservaPorId(props.idReserva));
const codigos = computed(() => codigosDeReserva(reserva.value));

/* ── Sugeridas del destino de la reserva ── */
const sugeridas = ref([]);
const cargandoSugeridas = ref(false);

async function cargarSugeridas() {
  sugeridas.value = leer(LLAVES.actividades(props.idReserva)) ?? [];
  if (!codigos.value.length || !enLinea.value) return;
  cargandoSugeridas.value = true;
  try {
    // Todas las del destino del viaje; en pantalla se muestran de a POR_PAGINA
    const datos = await actividadesDeCiudades(codigos.value, sesion.token);
    if (datos?.estado) {
      sugeridas.value = datos.consulta ?? [];
      guardar(LLAVES.actividades(props.idReserva), sugeridas.value);
    }
  } catch (e) {
    if (!(e instanceof SinConexionError)) console.warn('No se pudieron cargar las actividades', e);
  } finally {
    cargandoSugeridas.value = false;
  }
}
watch(() => props.idReserva, cargarSugeridas, { immediate: true });

/* ── Buscador de ciudades ── */
const texto = ref('');
const ciudades = ref([]);
const buscando = ref(false);
const errorBusqueda = ref('');
let espera;
let turno = 0;

watch(texto, (valor) => {
  clearTimeout(espera);
  errorBusqueda.value = '';
  const q = valor.trim();
  if (q.length < 2) {
    ciudades.value = [];
    buscando.value = false;
    return;
  }
  buscando.value = true;
  espera = setTimeout(() => buscarCiudades(q), 350);
});
onBeforeUnmount(() => clearTimeout(espera));

async function buscarCiudades(q) {
  const mio = ++turno;
  try {
    const datos = await buscarCiudadesConActividades(q, sesion.token);
    if (mio !== turno) return;
    ciudades.value = datos?.estado ? datos.consulta ?? [] : [];
    if (!datos?.estado) errorBusqueda.value = datos?.mensaje || 'No pudimos buscar ciudades.';
  } catch (e) {
    if (mio !== turno) return;
    ciudades.value = [];
    errorBusqueda.value = e instanceof SinConexionError ? 'Necesitas internet para buscar actividades.' : 'No pudimos buscar ciudades.';
  } finally {
    if (mio === turno) buscando.value = false;
  }
}

/* ── Actividades de la ciudad elegida ── */
const ciudadElegida = ref(null);
const deLaCiudad = ref([]);
const cargandoCiudad = ref(false);
const errorCiudad = ref('');

async function elegirCiudad(ciudad) {
  ciudadElegida.value = ciudad;
  texto.value = '';
  ciudades.value = [];
  deLaCiudad.value = [];
  errorCiudad.value = '';
  cargandoCiudad.value = true;
  try {
    const datos = await actividadesDeCiudades([ciudad.codigo], sesion.token);
    if (datos?.estado) deLaCiudad.value = datos.consulta ?? [];
    else errorCiudad.value = datos?.mensaje || 'No pudimos cargar las actividades.';
  } catch (e) {
    errorCiudad.value = e instanceof SinConexionError ? 'Necesitas internet para ver estas actividades.' : 'No pudimos cargar las actividades.';
  } finally {
    cargandoCiudad.value = false;
  }
}

const verSugeridas = () => {
  ciudadElegida.value = null;
  deLaCiudad.value = [];
  errorCiudad.value = '';
};

const lista = computed(() => (ciudadElegida.value ? deLaCiudad.value : sugeridas.value));
// Se muestran 8; "Ver más" agrega otras 8. Al cambiar de ciudad vuelve a 8.
const cuantas = ref(POR_PAGINA);
watch(ciudadElegida, () => (cuantas.value = POR_PAGINA));
const visibles = computed(() => lista.value.slice(0, cuantas.value));
const faltan = computed(() => Math.max(0, lista.value.length - cuantas.value));
const cargando = computed(() => (ciudadElegida.value ? cargandoCiudad.value : cargandoSugeridas.value && !sugeridas.value.length));
const destinoReserva = computed(() => {
  const nombres = [...new Set(sugeridas.value.map(ciudadDe).filter(Boolean))];
  return nombres.join(', ');
});

/* ── Detalle y solicitud ── */
const detalle = ref(null);
const sinImagen = ref({});
const imagen = (a) => (a.imagenes?.length && !sinImagen.value[a.id] ? urlLocal(a.imagenes[0]) : '');
const solicitar = (actividad) => abrirWhatsApp(mensajeActividad(actividad, reserva.value, sesion.usuario));
</script>

<template>
  <section class="actividades" aria-labelledby="titulo-actividades">
    <div class="cabeza">
      <div>
        <p class="antetitulo">Actividades y tours</p>
        <h3 id="titulo-actividades" class="titulo">
          <template v-if="ciudadElegida">Actividades en {{ nombrePropio(ciudadElegida.ciudad) }}</template>
          <template v-else-if="destinoReserva">Vive más en {{ destinoReserva }}</template>
          <template v-else>Vive más en tu destino</template>
        </h3>
      </div>

      <!-- Buscador de ciudad -->
      <div class="buscador">
        <label class="campo">
          <Search :size="18" aria-hidden="true" />
          <span class="solo-lectores">Buscar actividades por ciudad</span>
          <input
            v-model="texto"
            type="search"
            placeholder="Busca otra ciudad"
            autocomplete="off"
            enterkeyhint="search"
            :aria-expanded="ciudades.length > 0"
            aria-controls="ciudades-actividades"
          />
          <LoaderCircle v-if="buscando" :size="18" class="girar" aria-hidden="true" />
          <button v-else-if="texto" type="button" class="limpiar" aria-label="Borrar búsqueda" @click="texto = ''">
            <X :size="16" aria-hidden="true" />
          </button>
        </label>

        <div v-if="texto.trim().length >= 2 && !buscando" id="ciudades-actividades" class="opciones" role="listbox">
          <button
            v-for="c in ciudades"
            :key="c.codigo"
            type="button"
            role="option"
            class="opcion"
            @click="elegirCiudad(c)"
          >
            <MapPin :size="16" aria-hidden="true" />
            <span class="opcion-nombre">{{ nombrePropio(c.ciudad) }}</span>
            <span class="opcion-total">{{ c.total }} {{ c.total === 1 ? 'actividad' : 'actividades' }}</span>
          </button>
          <p v-if="errorBusqueda" class="opcion-vacia">{{ errorBusqueda }}</p>
          <p v-else-if="!ciudades.length" class="opcion-vacia">No hay actividades en esa ciudad por ahora.</p>
        </div>
      </div>
    </div>

    <button v-if="ciudadElegida" type="button" class="volver" @click="verSugeridas">
      ← Volver a las de tu viaje
    </button>

    <!-- Estado -->
    <div v-if="cargando" class="estado">
      <LoaderCircle :size="22" class="girar" aria-hidden="true" /> Buscando actividades…
    </div>
    <p v-else-if="ciudadElegida && errorCiudad" class="estado">{{ errorCiudad }}</p>
    <p v-else-if="!lista.length" class="estado">
      <template v-if="ciudadElegida">Esta ciudad todavía no tiene actividades disponibles.</template>
      <template v-else-if="!enLinea">Conéctate a internet para ver actividades en tu destino.</template>
      <template v-else>Busca una ciudad para ver las actividades y tours disponibles.</template>
    </p>

    <!-- Tarjetas -->
    <div v-else class="carrusel rejilla">
      <article v-for="a in visibles" :key="a.id" class="tarjeta-actividad">
        <button type="button" class="foto" :aria-label="`Ver detalle de ${nombrePropio(a.nombre)}`" @click="detalle = a">
          <img v-if="imagen(a)" :src="imagen(a)" alt="" loading="lazy" @error="sinImagen = { ...sinImagen, [a.id]: true }" />
          <span class="ciudad"><MapPin :size="13" aria-hidden="true" /> {{ ciudadDe(a) }}</span>
        </button>
        <div class="cuerpo">
          <h4 class="nombre">{{ nombrePropio(a.nombre) }}</h4>
          <p class="descripcion">{{ a.descripcion }}</p>
          <p class="precio"><span>Desde</span> {{ precioDesde(a) }} <span>por adulto</span></p>
          <div class="acciones">
            <button type="button" class="boton boton-secundario chico" @click="detalle = a">
              <Info :size="15" aria-hidden="true" /> Detalle
            </button>
            <button type="button" class="boton boton-marca chico" @click="solicitar(a)">
              Solicitar <ArrowRight :size="15" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="!cargando && faltan > 0" class="mas">
      <button type="button" class="boton boton-secundario" @click="cuantas += POR_PAGINA">
        Ver más actividades <span class="mas-cantidad">+{{ faltan }}</span>
      </button>
    </div>

    <!-- Detalle -->
    <Teleport to="body">
      <Transition name="hoja">
        <div v-if="detalle" class="fondo" @click.self="detalle = null" @keydown.esc="detalle = null">
          <div class="hoja" role="dialog" aria-modal="true" :aria-label="nombrePropio(detalle.nombre)">
            <button type="button" class="cerrar" aria-label="Cerrar" @click="detalle = null"><X :size="20" aria-hidden="true" /></button>

            <div v-if="detalle.imagenes?.length" class="galeria carrusel">
              <img v-for="(url, i) in detalle.imagenes" :key="i" :src="urlLocal(url)" alt="" loading="lazy" />
            </div>

            <div class="hoja-cuerpo">
              <p class="antetitulo"><MapPin :size="13" aria-hidden="true" /> {{ ciudadDe(detalle) }}</p>
              <h3 class="hoja-titulo">{{ nombrePropio(detalle.nombre) }}</h3>
              <p class="hoja-descripcion">{{ detalle.descripcion }}</p>

              <ul class="precios">
                <li v-for="p in preciosDe(detalle)" :key="p.etiqueta">
                  <span>{{ p.etiqueta }}</span><strong>{{ p.valor }}</strong>
                </li>
              </ul>
              <p v-if="textoPasajeros(detalle)" class="pasajeros"><Users :size="16" aria-hidden="true" /> {{ textoPasajeros(detalle) }}</p>

              <button type="button" class="boton boton-marca solicitar" @click="solicitar(detalle)">
                Solicitar por WhatsApp <ArrowRight :size="16" aria-hidden="true" />
              </button>
              <p class="nota">Te enviaremos la disponibilidad y el valor final para tu reserva.</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.actividades {
  margin-top: 20px;
}

/* Si es lo primero de la franja, sin espacio extra arriba */
.actividades:first-child {
  margin-top: 0;
}

.cabeza {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.mas {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.mas-cantidad {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--marca-suave);
  color: var(--marca-oscura);
  font-size: 0.78rem;
  font-weight: 700;
}

.titulo {
  margin-top: 4px;
  font-family: var(--fuente-titulos);
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* Buscador */
.buscador {
  position: relative;
  width: 100%;
}

.campo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--borde-fuerte);
  border-radius: 999px;
  background: var(--superficie);
  color: var(--suave);
  transition: border-color var(--transicion), box-shadow var(--transicion);
}

.campo:focus-within {
  border-color: var(--marca);
  box-shadow: var(--anillo);
}

.campo input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--texto);
  font: inherit;
  font-size: 1rem; /* 16px: iPhone no hace zoom */
}

.campo input::-webkit-search-cancel-button {
  display: none;
}

.limpiar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: var(--superficie-2);
  color: var(--texto-2);
  cursor: pointer;
}

.opciones {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 30;
  max-height: 300px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-sm);
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.opcion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--texto);
  text-align: left;
  cursor: pointer;
}

.opcion:hover,
.opcion:focus-visible {
  background: var(--marca-suave);
}

.opcion svg {
  color: var(--marca-oscura);
  flex-shrink: 0;
}

.opcion-nombre {
  flex: 1;
  font-weight: 600;
}

.opcion-total {
  color: var(--suave);
  font-size: 0.8rem;
  white-space: nowrap;
}

.opcion-vacia {
  padding: 12px;
  color: var(--texto-2);
  font-size: 0.9rem;
}

.volver {
  margin-bottom: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--marca-oscura);
  font-weight: 700;
  cursor: pointer;
}

.estado {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 20px;
  border: 1px dashed var(--borde-fuerte);
  border-radius: var(--radio);
  color: var(--texto-2);
}

.girar {
  animation: girar 0.9s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

/* Tarjetas */
.tarjeta-actividad {
  display: flex;
  flex-direction: column;
  width: 270px;
  overflow: hidden;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
  transition: transform var(--transicion), box-shadow var(--transicion);
}

.tarjeta-actividad:hover {
  transform: translateY(-3px);
  box-shadow: var(--sombra-3);
}

.foto {
  position: relative;
  display: block;
  height: 160px;
  padding: 0;
  overflow: hidden;
  border: 0;
  background:
    radial-gradient(220px 140px at 100% 0%, rgb(13 148 136 / 45%), transparent 70%),
    linear-gradient(135deg, var(--tinta-3), var(--tinta));
  cursor: pointer;
}

.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tarjeta-actividad:hover .foto img {
  transform: scale(1.06);
}

.ciudad {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(11 19 36 / 65%);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.cuerpo {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
  padding: 16px 16px 18px;
}

.nombre {
  font-family: var(--fuente-titulos);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
}

.descripcion {
  display: -webkit-box;
  overflow: hidden;
  color: var(--texto-2);
  font-size: 0.86rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.precio {
  margin-top: auto;
  padding-top: 6px;
  font-family: var(--fuente-titulos);
  font-size: 1.15rem;
  font-weight: 800;
}

.precio span {
  color: var(--suave);
  font-family: var(--fuente);
  font-size: 0.75rem;
  font-weight: 500;
}

.acciones {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  margin-top: 8px;
}

.chico {
  min-height: 40px;
  padding: 0 14px;
  font-size: 0.85rem;
}

/* Detalle */
.fondo {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(11 19 36 / 50%);
}

.hoja {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  overflow-y: auto;
  border-radius: var(--radio-xl) var(--radio-xl) 0 0;
  background: var(--superficie);
  padding-bottom: var(--abajo-seguro);
}

.cerrar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
  color: var(--texto);
  box-shadow: var(--sombra-2);
  cursor: pointer;
}

.galeria {
  gap: 0;
  margin: 0;
  padding: 0;
}

.galeria img {
  width: 100%;
  height: 230px;
  object-fit: cover;
}

.hoja-cuerpo {
  padding: 22px 22px 26px;
}

.hoja-cuerpo .antetitulo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hoja-titulo {
  margin-top: 4px;
  font-family: var(--fuente-titulos);
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hoja-descripcion {
  margin-top: 10px;
  color: var(--texto-2);
  white-space: pre-line;
}

.precios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.precios li {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  border-radius: var(--radio-sm);
  background: var(--superficie-2);
}

.precios span {
  color: var(--suave);
  font-size: 0.78rem;
}

.precios strong {
  font-family: var(--fuente-titulos);
  font-size: 1.1rem;
}

.pasajeros {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--texto-2);
  font-size: 0.9rem;
}

.solicitar {
  width: 100%;
  min-height: 50px;
  margin-top: 20px;
}

.nota {
  margin-top: 10px;
  color: var(--suave);
  font-size: 0.82rem;
  text-align: center;
}

.hoja-enter-active,
.hoja-leave-active {
  transition: opacity 0.2s ease;
}

.hoja-enter-active .hoja,
.hoja-leave-active .hoja {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hoja-enter-from,
.hoja-leave-to {
  opacity: 0;
}

.hoja-enter-from .hoja,
.hoja-leave-to .hoja {
  transform: translateY(40px);
}

@media (min-width: 720px) {
  .cabeza {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .buscador {
    max-width: 340px;
  }

  .fondo {
    align-items: center;
    padding: 24px;
  }

  .hoja {
    border-radius: var(--radio-xl);
  }
}

@media (min-width: 1024px) {
  .rejilla {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    margin: 0;
    padding: 0;
    overflow: visible;
  }

  .tarjeta-actividad {
    width: auto;
  }
}
</style>
