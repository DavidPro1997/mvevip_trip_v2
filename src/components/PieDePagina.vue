<script setup>
import { Facebook, Instagram, Mail, MessageCircle, Phone, Youtube } from 'lucide-vue-next';
import { CONTACTO, REDES } from '@/services/config';
import { useContacto } from '@/composables/useContacto';

const { abrirWhatsApp, abrirEnlace, llamar, enviarCorreo } = useContacto();
const anio = new Date().getFullYear();

const redes = [
  { id: 'facebook', etiqueta: 'Facebook', url: REDES.facebook, icono: Facebook },
  { id: 'instagram', etiqueta: 'Instagram', url: REDES.instagram, icono: Instagram },
  { id: 'youtube', etiqueta: 'YouTube', url: REDES.youtube, icono: Youtube },
];
</script>

<template>
  <footer class="pie">
    <div class="contenedor rejilla">
      <div class="marca">
        <img src="/img/logo.png" alt="Marketing VIP" class="logo" width="160" height="34" />
        <p class="lema">Especialistas en sueños. Te acompañamos antes, durante y después de tu viaje.</p>
      </div>

      <div class="bloque">
        <h3>Contacto</h3>
        <button type="button" class="dato" @click="abrirWhatsApp()"><MessageCircle :size="17" aria-hidden="true" /> WhatsApp</button>
        <button type="button" class="dato" @click="llamar"><Phone :size="17" aria-hidden="true" /> {{ CONTACTO.telefono }}</button>
        <button type="button" class="dato" @click="enviarCorreo('Consulta sobre mi viaje')"><Mail :size="17" aria-hidden="true" /> {{ CONTACTO.email }}</button>
      </div>

      <div class="bloque">
        <h3>Síguenos</h3>
        <div class="redes">
          <button v-for="red in redes" :key="red.id" type="button" class="red" :aria-label="red.etiqueta" :title="red.etiqueta" @click="abrirEnlace(red.url)">
            <component :is="red.icono" :size="19" />
          </button>
          <button type="button" class="red" aria-label="TikTok" title="TikTok" @click="abrirEnlace(REDES.tiktok)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.59-2.6 2.6 2.6 0 0 1 3.35-2.49V9.66a5.69 5.69 0 0 0-.76-.05A5.69 5.69 0 0 0 4.17 15.3 5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.69-5.69V9.01a7.35 7.35 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.23-1.48Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="contenedor legal">
      <span>© {{ anio }} Marketing VIP · Viajes Internacionales Premium</span>
    </div>
  </footer>
</template>

<style scoped>
.pie {
  margin-top: 80px;
  padding: 48px 0 calc(24px + var(--abajo-seguro));
  background: var(--tinta);
  color: rgb(255 255 255 / 72%);
}

.rejilla {
  display: grid;
  gap: 32px;
}

.logo {
  width: auto;
  height: 32px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  box-sizing: content-box;
}

.lema {
  max-width: 340px;
  margin-top: 16px;
  font-size: 0.92rem;
}

.bloque h3 {
  margin-bottom: 12px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.dato {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color var(--transicion);
}

.dato:hover {
  color: var(--marca-viva);
}

.redes {
  display: flex;
  gap: 10px;
}

.red {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  background: rgb(255 255 255 / 4%);
  color: #fff;
  cursor: pointer;
  transition: background var(--transicion), border-color var(--transicion);
}

.red:hover {
  background: var(--marca);
  border-color: var(--marca);
  color: var(--tinta);
}

.legal {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgb(255 255 255 / 10%);
  font-size: 0.82rem;
  color: rgb(255 255 255 / 50%);
}

@media (min-width: 768px) {
  .rejilla {
    grid-template-columns: 2fr 1fr 1fr;
  }
}
</style>
