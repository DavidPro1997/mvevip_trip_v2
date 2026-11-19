<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, CalendarClock, FileCheck2, IdCard, LoaderCircle, WifiOff } from 'lucide-vue-next';
import { useSesionStore } from '@/stores/sesion';
import { useConexion } from '@/composables/useConexion';
import { useContacto } from '@/composables/useContacto';
import { useAvisos } from '@/composables/useAvisos';
import { IMAGEN_PORTADA_LOGIN } from '@/services/config';

const sesion = useSesionStore();
const router = useRouter();
const { enLinea } = useConexion();
const { abrirWhatsApp } = useContacto();
const { mostrar, mostrarError } = useAvisos();

const cedula = ref('');
const enviando = ref(false);
const error = ref('');

const BENEFICIOS = [
  { icono: FileCheck2, texto: 'Tickets, reservas y documentos en un solo lugar' },
  { icono: CalendarClock, texto: 'Tu itinerario y el clima de cada destino' },
  { icono: WifiOff, texto: 'Disponible incluso sin conexión a internet' },
];

async function ingresar() {
  error.value = '';
  if (!cedula.value.trim()) {
    error.value = 'Ingresa tu número de documento.';
    return;
  }
  enviando.value = true;
  try {
    const resultado = await sesion.iniciarSesion(cedula.value);
    if (!resultado.ok) {
      error.value = resultado.mensaje;
      return;
    }
    mostrar('¡Bienvenido! Sesión iniciada correctamente.', 'exito');
    router.replace({ name: 'inicio' });
  } catch (e) {
    mostrarError(e, 'No pudimos iniciar tu sesión. Intenta de nuevo.');
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <main class="login">
    <!-- Lado visual (en celular es la franja de arriba) -->
    <section class="visual" :style="{ backgroundImage: `url('${IMAGEN_PORTADA_LOGIN}'), url('/img/headers/avion.jpg')` }">
      <div class="visual-capa"></div>
      <div class="visual-contenido">
        <span class="insignia insignia-oscura">Billetera de viaje</span>
        <h2 class="visual-titulo">Todo tu viaje,<br />en un solo lugar.</h2>
        <ul class="beneficios">
          <li v-for="b in BENEFICIOS" :key="b.texto">
            <span class="beneficio-icono"><component :is="b.icono" :size="18" aria-hidden="true" /></span>
            {{ b.texto }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Formulario -->
    <section class="lado-formulario">
      <div class="panel aparecer">
        <img src="/img/logo.png" alt="Marketing VIP" class="logo" width="200" height="43" />

        <div class="encabezado">
          <h1>Bienvenido</h1>
          <p>Ingresa tu número de documento para ver tus viajes.</p>
        </div>

        <form class="formulario" novalidate @submit.prevent="ingresar">
          <label for="cedula" class="etiqueta">Cédula o pasaporte</label>
          <div class="campo" :class="{ conError: error }">
            <IdCard :size="20" class="icono" aria-hidden="true" />
            <input
              id="cedula"
              v-model="cedula"
              type="text"
              autocomplete="username"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="Ej. 1712345678"
              :aria-invalid="Boolean(error)"
              aria-describedby="error-cedula"
            />
          </div>
          <p v-if="error" id="error-cedula" class="mensaje error" role="alert">{{ error }}</p>
          <p v-else-if="!enLinea" class="mensaje aviso">Necesitas internet para iniciar sesión la primera vez.</p>

          <button type="submit" class="boton entrar" :disabled="enviando">
            <LoaderCircle v-if="enviando" :size="18" class="girando" aria-hidden="true" />
            <template v-if="enviando">Ingresando…</template>
            <template v-else>Ingresar <ArrowRight :size="18" aria-hidden="true" /></template>
          </button>
        </form>

        <div class="separador"><span>¿Necesitas ayuda?</span></div>

        <button type="button" class="boton boton-secundario ayuda" @click="abrirWhatsApp('Hola, no puedo iniciar sesión en mi billetera de viaje.')">
          No puedo iniciar sesión
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login {
  display: grid;
  min-height: 100dvh;
  background: var(--superficie);
}

/* ── Visual ── */
.visual {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  background-color: var(--tinta);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  color: #fff;
}

.visual-capa {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 400px at 0% 100%, rgb(154 195 28 / 28%), transparent 60%),
    linear-gradient(180deg, rgb(11 19 36 / 35%) 0%, rgb(11 19 36 / 88%) 100%);
}

.visual-contenido {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  min-height: 240px;
  padding: 28px var(--margen);
}

.visual-contenido .insignia {
  align-self: flex-start;
}

.visual-titulo {
  margin-top: 14px;
  font-size: clamp(1.7rem, 6vw, 3.2rem);
  font-weight: 800;
  line-height: 1.05;
}

.beneficios {
  display: none;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.beneficios li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: rgb(255 255 255 / 86%);
}

.beneficio-icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgb(255 255 255 / 12%);
  color: var(--marca-viva);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

/* ── Formulario ── */
.lado-formulario {
  display: grid;
  place-items: center;
  padding: 32px var(--margen) calc(32px + var(--abajo-seguro));
}

.panel {
  width: 100%;
  max-width: 400px;
}

.logo {
  width: 170px;
  height: auto;
  margin-bottom: 36px;
}

.encabezado h1 {
  font-size: 2rem;
  font-weight: 800;
}

.encabezado p {
  margin-top: 8px;
  color: var(--texto-2);
}

.formulario {
  margin-top: 28px;
}

.etiqueta {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 650;
}

.campo {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  border: 1.5px solid var(--borde-fuerte);
  border-radius: 16px;
  background: var(--superficie);
  transition: border-color var(--transicion), box-shadow var(--transicion);
}

.campo:focus-within {
  border-color: var(--marca);
  box-shadow: var(--anillo);
}

.campo.conError {
  border-color: var(--peligro);
}

.icono {
  color: var(--suave);
  flex-shrink: 0;
}

.campo input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.mensaje {
  margin-top: 8px;
  font-size: 0.875rem;
}

.error {
  color: var(--peligro);
}

.aviso {
  color: var(--aviso);
}

.entrar {
  width: 100%;
  height: 56px;
  margin-top: 20px;
  font-size: 1rem;
}

.separador {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 16px;
  color: var(--suave);
  font-size: 0.82rem;
}

.separador::before,
.separador::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--borde);
}

.ayuda {
  width: 100%;
}

/* ── PC: pantalla dividida ── */
@media (min-width: 960px) {
  .login {
    grid-template-columns: minmax(0, 1.1fr) minmax(480px, 1fr);
  }

  .visual {
    margin: 16px;
    border-radius: 32px;
  }

  .visual-contenido {
    padding: 56px;
  }

  .beneficios {
    display: block;
  }
}
</style>
