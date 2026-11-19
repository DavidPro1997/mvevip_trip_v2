import { readonly, ref } from 'vue';
import { SinConexionError } from '@/services/api';

const avisos = ref([]);
let siguienteId = 1;

/**
 * Avisos cortos abajo de la pantalla (reemplazan los SweetAlert del front anterior).
 * tipo: 'info' | 'exito' | 'error' | 'sinConexion'
 */
export function useAvisos() {
  const quitar = (id) => {
    avisos.value = avisos.value.filter((a) => a.id !== id);
  };

  const mostrar = (texto, tipo = 'info', segundos = 4) => {
    // Si ya se está mostrando el mismo aviso, no se repite
    if (avisos.value.some((a) => a.texto === texto)) return;
    const id = siguienteId++;
    avisos.value = [...avisos.value, { id, texto, tipo }];
    setTimeout(() => quitar(id), segundos * 1000);
  };

  /** Aviso según el error: sin conexión o mensaje genérico */
  const mostrarError = (error, porDefecto = 'Algo salió mal. Intenta de nuevo.') => {
    if (error instanceof SinConexionError) mostrar(error.message, 'sinConexion', 5);
    else mostrar(error?.message || porDefecto, 'error', 5);
  };

  const sinConexion = () => mostrar(new SinConexionError().message, 'sinConexion', 5);

  return { avisos: readonly(avisos), mostrar, mostrarError, sinConexion, quitar };
}
