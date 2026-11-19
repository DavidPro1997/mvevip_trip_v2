import { readonly, ref } from 'vue';

// Un solo estado para toda la app (los eventos online/offline se escuchan una vez)
const enLinea = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => (enLinea.value = true));
  window.addEventListener('offline', () => (enLinea.value = false));
}

/** ¿Hay internet? (reactivo) */
export function useConexion() {
  return { enLinea: readonly(enLinea) };
}
