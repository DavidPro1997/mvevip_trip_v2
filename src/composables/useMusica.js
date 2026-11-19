import { readonly, ref } from 'vue';
import { urlLocal } from '@/services/archivos';

// Un solo reproductor para toda la app (la música sigue al cambiar de pantalla)
let audio = null;
const fuente = ref('');
const sonando = ref(false);

/**
 * Música de la personalización del viaje: en bucle; el navegador solo deja sonar después de un toque,
 * por eso se intenta al abrir y otra vez al cerrar la bienvenida.
 */
export function useMusica() {
  const cargar = (url) => {
    if (!url || fuente.value === url) return;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.addEventListener('play', () => (sonando.value = true));
      audio.addEventListener('pause', () => (sonando.value = false));
    }
    fuente.value = url;
    audio.src = urlLocal(url);
  };

  const reproducir = async () => {
    if (!audio || sonando.value) return;
    try {
      await audio.play();
    } catch {
      /* el navegador bloqueó el sonido automático: sonará al tocar el botón */
    }
  };

  const alternar = () => (sonando.value ? audio?.pause() : reproducir());

  const detener = () => {
    audio?.pause();
    if (audio) audio.removeAttribute('src');
    fuente.value = '';
  };

  return { hayMusica: readonly(fuente), sonando: readonly(sonando), cargar, reproducir, alternar, detener };
}
