import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as api from '@/services/api';
import { LLAVES, borrarTodo, guardar, leer } from '@/services/almacenamiento';
import { borrarArchivos, guardarVarios, respuestaDeBase64 } from '@/services/archivos';
import { archivosParaGuardar, idDeReserva } from '@/services/reservas';
import { ENLACES_MVEVIP, IMAGEN_PORTADA_INICIO, IMAGEN_PORTADA_LOGIN } from '@/services/config';

/**
 * Sesión del cliente: usuario (con su token) y reservas, guardados en el teléfono.
 * Con datos guardados la app abre al instante, con o sin internet; si hay internet se actualiza sola.
 */
export const useSesionStore = defineStore('sesion', () => {
  const usuario = ref(leer(LLAVES.usuario));
  const reservas = ref(leer(LLAVES.reservas) ?? []);
  // Como antes (verificarData): hay sesión si están guardados el usuario Y las reservas
  const reservasCargadas = ref(leer(LLAVES.reservas) !== null);
  const actualizado = ref(leer(LLAVES.actualizado));
  const actualizando = ref(false);
  // Avance de los documentos que se guardan para usar sin conexión
  const guardado = ref({ listos: 0, total: 0, activo: false });

  const haySesion = computed(() => Boolean(usuario.value) && reservasCargadas.value);
  const token = computed(() => usuario.value?.token ?? null);

  const reservaPorId = (id) => reservas.value.find((r) => idDeReserva(r) === String(id)) ?? null;

  /** Enlace firmado nuevo de un documento (cuando el que vino en la reserva ya venció). Lanza SinConexionError sin internet. */
  async function enlaceNuevo(ruta) {
    const datos = await api.linkDescarga(ruta, token.value);
    return datos?.estado ? datos.linkDescarga : null;
  }

  /** El documento mismo por la API (cuando S3 no deja leerlo desde el navegador). Lanza SinConexionError sin internet. */
  async function archivoPorApi(ruta) {
    const datos = await api.archivoTrip(ruta, token.value);
    return datos?.estado && datos.base64 ? respuestaDeBase64(datos.base64, datos.tipo) : null;
  }

  /** Lo que necesitan services/archivos.js para bajar documentos: enlace nuevo y descarga por la API */
  const ayudaArchivos = { renovar: enlaceNuevo, porApi: archivoPorApi };

  /** Guarda en el teléfono los PDFs e imágenes de las reservas (en segundo plano) */
  async function guardarParaSinConexion() {
    if (guardado.value.activo) return;
    guardado.value = { listos: 0, total: 0, activo: true };
    try {
      const archivos = [
        IMAGEN_PORTADA_INICIO,
        IMAGEN_PORTADA_LOGIN,
        ...ENLACES_MVEVIP.map((e) => e.imagen),
        ...archivosParaGuardar(reservas.value, usuario.value)];
      await guardarVarios(archivos, (listos, total) => {
        guardado.value = { listos, total, activo: true };
      }, ayudaArchivos);
    } finally {
      guardado.value = { ...guardado.value, activo: false };
    }
  }

  /** Respuesta exitosa de iniciarSession / verificarSession (igual que conSession) */
  function aplicar(datos) {
    if (datos.consulta) {
      usuario.value = datos.consulta;
      guardar(LLAVES.usuario, datos.consulta);
    }
    reservas.value = Array.isArray(datos.reservas) ? datos.reservas : [];
    reservasCargadas.value = true;
    guardar(LLAVES.reservas, reservas.value);
    actualizado.value = new Date().toISOString();
    guardar(LLAVES.actualizado, actualizado.value);
    guardarParaSinConexion();
  }

  /** @returns {Promise<{ ok: boolean, mensaje?: string }>} lanza SinConexionError sin internet */
  async function iniciarSesion(cedula) {
    const datos = await api.iniciarSesion(cedula.trim());
    if (!datos?.estado) return { ok: false, mensaje: datos?.mensaje || 'No pudimos iniciar tu sesión.' };
    aplicar(datos);
    return { ok: true };
  }

  /**
   * Trae otra vez las reservas. Si la API dice que la sesión ya no vale, se cierra.
   * @returns {Promise<boolean>} true si la sesión sigue activa. Lanza SinConexionError sin internet.
   */
  async function actualizar() {
    if (actualizando.value) return true;
    actualizando.value = true;
    try {
      const datos = await api.verificarSesion(token.value);
      if (!datos?.estado) {
        await cerrarSesion();
        return false;
      }
      aplicar(datos);
      return true;
    } finally {
      actualizando.value = false;
    }
  }

  async function cerrarSesion() {
    usuario.value = null;
    reservas.value = [];
    reservasCargadas.value = false;
    actualizado.value = null;
    borrarTodo();
    // Los documentos son personales: no quedan en el teléfono
    await borrarArchivos().catch(() => {});
  }

  return {
    usuario,
    reservas,
    actualizado,
    actualizando,
    guardado,
    haySesion,
    token,
    reservaPorId,
    enlaceNuevo,
    ayudaArchivos,
    iniciarSesion,
    actualizar,
    cerrarSesion,
    guardarParaSinConexion,
  };
});
