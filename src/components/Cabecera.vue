<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronDown, Headset, LogOut, Phone, RefreshCw } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { useContacto } from '@/composables/useContacto';
import { useMusica } from '@/composables/useMusica';
import { useActualizar } from '@/composables/useActualizar';
import { personalizacionDe } from '@/services/reservas';
import { urlLocal } from '@/services/archivos';
import { nombrePropio } from '@/services/formato';
import Dialogo from './Dialogo.vue';

const sesion = useSesionStore();
const route = useRoute();
const router = useRouter();
const { abrirWhatsApp, llamar } = useContacto();
const musica = useMusica();
const { actualizar } = useActualizar();

// Logo de la empresa del cliente (personalización del viaje), junto al de Marketing VIP
const logoPersonalizado = computed(() => urlLocal(personalizacionDe(sesion.reservas)?.logo ?? ''));

const nombre = computed(() => nombrePropio([sesion.usuario?.nombres, sesion.usuario?.apellidos].filter(Boolean).join(' ')));
const iniciales = computed(() => {
  const partes = [sesion.usuario?.nombres, sesion.usuario?.apellidos].map((p) => String(p ?? '').trim()[0]).filter(Boolean);
  return partes.join('').toUpperCase() || 'MV';
});

// Menú de la cuenta
const menuAbierto = ref(false);
const menu = ref(null);
const alClicFuera = (e) => {
  if (menu.value && !menu.value.contains(e.target)) menuAbierto.value = false;
};
onMounted(() => document.addEventListener('pointerdown', alClicFuera));
onBeforeUnmount(() => document.removeEventListener('pointerdown', alClicFuera));

const confirmarSalida = ref(false);

async function salir() {
  confirmarSalida.value = false;
  musica.detener();
  await sesion.cerrarSesion();
  router.replace({ name: 'login' });
}

function opcion(accion) {
  menuAbierto.value = false;
  accion();
}

const ayuda = () => abrirWhatsApp('Hola, necesito ayuda con mi viaje.');
const irA = (hash) => router.push({ name: 'inicio', hash });
</script>

<template>
  <header class="cabecera">
    <div class="contenedor fila">
      <RouterLink :to="{ name: 'inicio' }" class="marcas" aria-label="Ir al inicio">
        <img src="/img/logo.png" alt="Marketing VIP" class="logo" width="160" height="34" />
        <img v-if="logoPersonalizado" :src="logoPersonalizado" alt="" class="logo-cliente" />
      </RouterLink>

      <nav class="navegacion" aria-label="Principal">
        <RouterLink :to="{ name: 'inicio' }" class="enlace" :class="{ activo: route.name === 'inicio' || route.name === 'reserva' }">
          Mis viajes
        </RouterLink>
        <a href="/inicio#servicios" class="enlace" @click.prevent="irA('#servicios')">Servicios</a>
        <a href="/inicio#descubre" class="enlace" @click.prevent="irA('#descubre')">Marketing VIP</a>
      </nav>

      <div class="acciones">
        <button type="button" class="boton ayuda" @click="ayuda">
          <Headset :size="18" aria-hidden="true" />
          <span>Ayuda</span>
        </button>

        <div ref="menu" class="usuario">
          <button
            type="button"
            class="avatar-boton"
            :aria-expanded="menuAbierto"
            aria-haspopup="menu"
            aria-label="Menú de tu cuenta"
            @click="menuAbierto = !menuAbierto"
          >
            <span class="avatar">{{ iniciales }}</span>
            <ChevronDown :size="16" class="flecha" aria-hidden="true" />
          </button>

          <Transition name="menu">
            <div v-if="menuAbierto" class="menu" role="menu">
              <div class="menu-cabeza">
                <span class="avatar grande">{{ iniciales }}</span>
                <div class="menu-nombre">
                  <strong>{{ nombre || 'Viajero' }}</strong>
                  <span class="texto-suave">Billetera de viaje</span>
                </div>
              </div>
              <button type="button" role="menuitem" class="menu-opcion" @click="opcion(actualizar)">
                <RefreshCw :size="18" aria-hidden="true" /> Actualizar mis viajes
              </button>
              <button type="button" role="menuitem" class="menu-opcion" @click="opcion(ayuda)">
                <Headset :size="18" aria-hidden="true" /> Hablar con un asesor
              </button>
              <button type="button" role="menuitem" class="menu-opcion" @click="opcion(llamar)">
                <Phone :size="18" aria-hidden="true" /> Llamar a Marketing VIP
              </button>
              <hr />
              <button type="button" role="menuitem" class="menu-opcion peligro" @click="opcion(() => (confirmarSalida = true))">
                <LogOut :size="18" aria-hidden="true" /> Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>

  <Dialogo
    :abierto="confirmarSalida"
    titulo="¿Cerrar sesión?"
    texto="Se borrarán de este dispositivo tus reservas y documentos guardados. Para volver a verlos necesitarás internet."
    confirmar="Cerrar sesión"
    peligro
    @confirmar="salir"
    @cerrar="confirmarSalida = false"
  />
</template>

<style scoped>
.cabecera {
  height: var(--alto-cabecera);
  background: rgb(255 255 255 / 82%);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid rgb(11 19 36 / 7%);
}

.fila {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
}

.marcas {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.logo {
  width: auto;
  height: 30px;
}

.logo-cliente {
  height: 30px;
  width: auto;
  max-width: 96px;
  object-fit: contain;
  padding-left: 14px;
  border-left: 1px solid var(--borde);
}

.navegacion {
  display: none;
  gap: 4px;
  margin: 0 auto;
}

.enlace {
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--texto-2);
  font-size: 0.92rem;
  font-weight: 600;
  transition: background var(--transicion), color var(--transicion);
}

.enlace:hover {
  background: var(--superficie-2);
  color: var(--texto);
}

.enlace.activo {
  background: var(--tinta);
  color: #fff;
}

.acciones {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.ayuda {
  min-height: 40px;
  padding: 0 11px;
  background: var(--marca-suave);
  color: var(--marca-oscura);
}

.ayuda:hover {
  background: #e3efc3;
}

.ayuda span {
  display: none;
}

.usuario {
  position: relative;
}

.avatar-boton {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 3px;
  border: 1px solid var(--borde);
  border-radius: 999px;
  background: var(--superficie);
  cursor: pointer;
  transition: box-shadow var(--transicion);
}

.avatar-boton:hover {
  box-shadow: var(--sombra-1);
}

.avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--tinta-3), var(--tinta));
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.avatar.grande {
  width: 44px;
  height: 44px;
  font-size: 0.92rem;
  flex-shrink: 0;
}

.flecha {
  color: var(--suave);
}

.menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 50;
  width: 284px;
  padding: 8px;
  border: 1px solid var(--borde);
  border-radius: 18px;
  background: var(--superficie);
  box-shadow: var(--sombra-3);
}

.menu-cabeza {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 14px;
}

.menu-nombre {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.menu-nombre strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  font-size: 0.92rem;
  font-weight: 550;
  text-align: left;
  cursor: pointer;
}

.menu-opcion:hover {
  background: var(--superficie-2);
}

.menu-opcion svg {
  color: var(--suave);
}

.menu-opcion.peligro,
.menu-opcion.peligro svg {
  color: var(--peligro);
}

.menu hr {
  margin: 6px 4px;
  border: 0;
  border-top: 1px solid var(--borde);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (min-width: 900px) {
  .navegacion {
    display: flex;
  }

  .ayuda {
    padding: 0 16px;
  }

  .ayuda span {
    display: inline;
  }
}
</style>
