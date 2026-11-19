/**
 * localStorage seguro (modo privado o almacenamiento lleno no rompen la app).
 * Las llaves 'usuario' y 'reservas' son las mismas del front anterior: quien ya tenía sesión la conserva.
 */
export const LLAVES = {
  usuario: 'usuario',
  reservas: 'reservas',
  actualizado: 'mvevip:actualizado',
  clima: (idReserva) => `mvevip:clima:${idReserva}`,
  actividades: (idReserva) => `mvevip:actividades:${idReserva}`,
};

export function leer(llave, porDefecto = null) {
  try {
    const valor = localStorage.getItem(llave);
    return valor === null ? porDefecto : JSON.parse(valor);
  } catch {
    return porDefecto;
  }
}

export function guardar(llave, valor) {
  try {
    localStorage.setItem(llave, JSON.stringify(valor));
  } catch (e) {
    console.warn('No se pudo guardar en el teléfono:', llave, e);
  }
}

export function borrar(llave) {
  try {
    localStorage.removeItem(llave);
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}

/** Borra todo lo de la app (al cerrar sesión) */
export function borrarTodo() {
  try {
    Object.keys(localStorage)
      .filter((llave) => llave === LLAVES.usuario || llave === LLAVES.reservas || llave === 'token' || llave.startsWith('mvevip:'))
      .forEach((llave) => localStorage.removeItem(llave));
  } catch {
    /* sin almacenamiento */
  }
}
