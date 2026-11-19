<script setup>
/** Accesos a la web de Marketing VIP: mosaico de fotos, el primero (Inicio) destacado. */
import { ref } from 'vue';
import { ArrowUpRight, Building2, CreditCard, Globe, LayoutGrid, Tag } from 'lucide-vue-next';
import { ENLACES_MVEVIP } from '@/services/config';
import { hayInternet } from '@/services/api';
import { useAvisos } from '@/composables/useAvisos';

const { sinConexion } = useAvisos();

// Ícono y color de cada enlace (el color tiñe el degradado sobre la foto)
const ESTILO = {
  inicio: { icono: Globe, color: 'marca' },
  promociones: { icono: Tag, color: 'coral' },
  catalogos: { icono: LayoutGrid, color: 'violeta' },
  bancos: { icono: CreditCard, color: 'turquesa' },
  nosotros: { icono: Building2, color: 'cielo' },
};

// Fotos que no cargaron (sin internet y sin guardar): queda el degradado
const sinFoto = ref({});

// Son enlaces normales (se pueden abrir en otra pestaña); sin internet se avisa en vez de abrir
function alAbrir(evento) {
  if (hayInternet()) return;
  evento.preventDefault();
  sinConexion();
}
</script>

<template>
  <section id="descubre">
    <div class="seccion-cabeza">
      <div>
        <p class="antetitulo">Marketing VIP</p>
        <h2 class="titulo-seccion">Sigue descubriendo</h2>
      </div>
    </div>

    <ul class="mosaico">
      <li v-for="(enlace, i) in ENLACES_MVEVIP" :key="enlace.id" :class="{ destacado: i === 0 }">
        <a
          class="enlace"
          :class="ESTILO[enlace.id]?.color"
          :href="enlace.url"
          target="_blank"
          rel="noopener"
          @click="alAbrir"
        >
          <img
            v-if="enlace.imagen && !sinFoto[enlace.id]"
            class="foto"
            :src="enlace.imagen"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="sinFoto = { ...sinFoto, [enlace.id]: true }"
          />
          <span class="velo" aria-hidden="true"></span>

          <span class="arriba">
            <span class="etiqueta">
              <component :is="ESTILO[enlace.id]?.icono" :size="14" aria-hidden="true" />
              {{ enlace.etiqueta }}
            </span>
            <span class="flecha" aria-hidden="true"><ArrowUpRight :size="18" /></span>
          </span>

          <span class="textos">
            <span class="titulo">{{ enlace.titulo }}</span>
            <span class="detalle">{{ enlace.detalle }}</span>
            <span v-if="i === 0" class="ir">Visitar mvevip.com <ArrowUpRight :size="16" aria-hidden="true" /></span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.mosaico {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 160px;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.destacado {
  grid-column: 1 / -1;
  grid-row: span 2;
}

.enlace {
  --c: var(--marca);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 14px;
  overflow: hidden;
  border-radius: var(--radio);
  background: linear-gradient(135deg, var(--c), var(--tinta));
  color: #fff;
  isolation: isolate;
  box-shadow: var(--sombra-1);
  transition: transform var(--transicion), box-shadow var(--transicion);
}

.marca { --c: var(--marca-oscura); }
.coral { --c: var(--coral); }
.violeta { --c: var(--violeta); }
.turquesa { --c: var(--turquesa); }
.cielo { --c: var(--cielo); }

.foto {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Degradado: oscuro abajo para leer el texto, con un toque del color del enlace */
.velo {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(180deg, rgb(11 19 36 / 0%) 25%, rgb(11 19 36 / 82%) 100%),
    linear-gradient(135deg, color-mix(in srgb, var(--c) 55%, transparent), transparent 60%);
  transition: opacity var(--transicion);
}

.arriba {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.etiqueta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 18%);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.flecha {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
  color: var(--tinta);
  flex-shrink: 0;
  transition: transform var(--transicion), background var(--transicion);
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 12px rgb(0 0 0 / 30%);
}

.detalle {
  color: rgb(255 255 255 / 82%);
  font-size: 0.8rem;
  line-height: 1.35;
}

.ir {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--marca);
  color: var(--tinta);
  font-size: 0.85rem;
  font-weight: 700;
  transition: background var(--transicion);
}

.destacado .enlace {
  padding: 20px;
}

.destacado .titulo {
  font-size: clamp(1.4rem, 4vw, 2rem);
  max-width: 18ch;
}

.destacado .detalle {
  font-size: 0.92rem;
}

/* Efectos al pasar el mouse / tocar */
.enlace:hover {
  transform: translateY(-3px);
  box-shadow: var(--sombra-3);
}

.enlace:hover .foto {
  transform: scale(1.08);
}

.enlace:hover .flecha {
  transform: rotate(45deg);
  background: var(--marca);
}

.enlace:hover .ir {
  background: var(--marca-viva);
}

.enlace:active {
  transform: scale(0.98);
}

.enlace:focus-visible {
  outline: 3px solid var(--marca);
  outline-offset: 3px;
}

@media (min-width: 640px) {
  .mosaico {
    grid-auto-rows: 190px;
    gap: 14px;
  }
}

/* PC: Inicio grande a la izquierda y 4 a la derecha */
@media (min-width: 1024px) {
  .mosaico {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: 200px;
    gap: 16px;
  }

  .destacado {
    grid-column: span 2;
  }

  .titulo {
    font-size: 1.15rem;
  }

  .destacado .enlace {
    padding: 26px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .enlace,
  .foto,
  .flecha {
    transition: none;
  }
}
</style>
