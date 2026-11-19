import { useRouter } from 'vue-router';
import { useSesionStore } from '@/stores/sesion';
import { hayInternet } from '@/services/api';
import { useAvisos } from './useAvisos';

/** "Actualizar mis viajes": vuelve a pedir las reservas y avisa el resultado. */
export function useActualizar() {
  const sesion = useSesionStore();
  const router = useRouter();
  const { mostrar, mostrarError, sinConexion } = useAvisos();

  async function actualizar() {
    if (!hayInternet()) return sinConexion();
    try {
      const sigue = await sesion.actualizar();
      if (!sigue) {
        mostrar('Tu sesión terminó. Vuelve a ingresar.', 'info');
        router.replace({ name: 'login' });
        return;
      }
      mostrar('Tus viajes están al día.', 'exito', 2.5);
    } catch (e) {
      mostrarError(e);
    }
  }

  return { actualizar };
}
