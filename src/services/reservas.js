/**
 * Lógica de las reservas (port de construirDOMPDFS / renderReservations del front anterior).
 * Funciones puras: reciben la reserva y el usuario y devuelven datos listos para mostrar.
 */
import { IMAGEN_RESERVA_POR_DEFECTO } from './config';
import { aFecha, fechaCorta } from './formato';

/** Categorías de documentos, en el orden de las pestañas */
export const CATEGORIAS = ['documentos', 'tickets', 'boarding', 'seguro', 'sim', 'otro', 'hotel'];

// Documentos de facturación interna: nunca se muestran al cliente
const TIPOS_FACTURACION = [15, 16, 17, 18, 19];

export const idDeReserva = (reserva) => String(reserva?.idReserva ?? reserva?.id ?? '');

export const destinosDe = (reserva) =>
  Array.isArray(reserva?.destinos) ? reserva.destinos : Array.isArray(reserva?.destino) ? reserva.destino : [];

const nombreCompleto = (persona) => `${persona?.nombres ?? ''} ${persona?.apellidos ?? ''}`.trim();
const mismoViajero = (a, b) => a != null && b != null && Number(a) === Number(b);

/** Resumen para la tarjeta de la reserva: ciudades, primera fecha y su imagen */
export function resumenReserva(reserva) {
  const destinos = destinosDe(reserva);
  const ciudades = destinos.map((d) => d.ciudad).filter(Boolean);

  // Destino con la fecha de viaje más temprana (si ninguna fecha es válida, el primero)
  const conFecha = destinos.map((d) => ({ d, fecha: aFecha(d.fechaViaje) })).filter((x) => x.fecha);
  const primero = conFecha.length ? conFecha.reduce((a, b) => (a.fecha <= b.fecha ? a : b)).d : destinos[0];

  return {
    id: idDeReserva(reserva),
    titulo: ciudades.join(' - ') || 'Sin destino',
    ciudades,
    fecha: primero?.fechaViaje ? fechaCorta(primero.fechaViaje) : '',
    imagen: primero?.urlImagen || IMAGEN_RESERVA_POR_DEFECTO,
    // El encabezado de la reserva usa la imagen del primer destino (igual que antes)
    imagenPortada: destinos[0]?.urlImagen || primero?.urlImagen || IMAGEN_RESERVA_POR_DEFECTO,
  };
}

/** ¿El usuario tiene billetera conjunta en esta reserva? (ve los documentos de todos los viajeros) */
export function tieneBilleteraConjunta(reserva, usuario) {
  const viajero = (reserva?.viajeros ?? []).find((v) => String(v.idViajero) === String(usuario?.idViajero));
  return Number(viajero?.billeteraConjunta) === 1;
}

/** Categoría de un documento adicional según el texto de su tipo de servicio */
export function categoriaExtra(tipoDocumento) {
  const tipo = String(tipoDocumento ?? '').toLowerCase();
  if (tipo.includes('sim')) return 'sim';
  if (tipo.includes('board')) return 'boarding';
  if (tipo.includes('seguro') || tipo.includes('insurance')) return 'seguro';
  return 'otro';
}

const TITULO_EXTRA = { sim: 'SIM', boarding: 'Boarding pass', seguro: 'Seguro de viajes', otro: 'Documento adicional' };

/**
 * Documentos que el usuario puede ver en la reserva, por categoría.
 * Cada documento: { url, ruta, titulo }.
 */
export function clasificarDocumentos(reserva, usuario) {
  const resultado = Object.fromEntries(CATEGORIAS.map((c) => [c, []]));
  if (!reserva) return resultado;

  const conjunta = tieneBilleteraConjunta(reserva, usuario);
  const esDelUsuario = (idViajero) => conjunta || mismoViajero(idViajero, usuario?.idViajero);

  // Documentos personales de los viajeros
  (reserva.viajeros ?? []).forEach((viajero) => {
    if (!esDelUsuario(viajero.idViajero)) return;
    (viajero.docs ?? []).forEach((doc) => {
      resultado.documentos.push({
        url: doc.urlFirmada,
        ruta: doc.ruta,
        titulo: `${doc.tipoDocumento} - ${nombreCompleto(viajero)}`,
      });
    });
  });

  // Reserva completa (pestaña "Reserva")
  if (reserva.urlFirmadaReservaCompleta) {
    resultado.hotel.push({ url: reserva.urlFirmadaReservaCompleta, ruta: reserva.rutaReservaCompleta, titulo: 'Reserva' });
  }

  // Tickets aéreos: con billetera conjunta todos; si no, solo donde viaja el usuario
  (reserva.tickets ?? []).forEach((ticket) => {
    const viajeros = ticket.viajeros ?? [];
    const propio = viajeros.find((v) => mismoViajero(v.idViajero, usuario?.idViajero));
    if (!conjunta && !propio) return;
    const tramo = (ticket.tramos ?? []).map((t) => `${t.codigoCiudadSalida} → ${t.codigoCiudadDestino}`).join(', ');
    const personas = conjunta ? viajeros.map(nombreCompleto).join(', ') : nombreCompleto(propio);
    resultado.tickets.push({ url: ticket.urlFirmada, ruta: ticket.ruta, titulo: `${tramo} - ${personas}` });
  });

  // Documentos adicionales: categoría por el tipo de servicio (no por el archivo); solo los marcados para el trip
  (reserva.documentos ?? []).forEach((documento) => {
    if (Number(documento.mostrarTrip) !== 1 || !esDelUsuario(documento.idViajero)) return;
    const categoria = categoriaExtra(documento.tipoDocumento);
    (documento.docs ?? []).forEach((doc) => {
      if (!doc.urlFirmada || TIPOS_FACTURACION.includes(Number(doc.idTipoDocumento))) return;
      resultado[categoria].push({
        url: doc.urlFirmada,
        ruta: doc.ruta,
        titulo: `${TITULO_EXTRA[categoria]} - ${nombreCompleto(documento)}`,
      });
    });
  });

  return resultado;
}

/** Actividades de la reserva ordenadas por fecha de inicio */
export function actividadesOrdenadas(reserva) {
  const lista = Array.isArray(reserva?.actividades) ? reserva.actividades.slice() : [];
  return lista.sort((a, b) => (aFecha(a.fechaInicio)?.getTime() ?? 0) - (aFecha(b.fechaInicio)?.getTime() ?? 0));
}

/** Ubicaciones y tipos de clima de la reserva (la API manda clima_tipoa o clima_tipos) */
export function climaDe(reserva) {
  return {
    ubicaciones: Array.isArray(reserva?.clima) ? reserva.clima : [],
    tipos: reserva?.clima_tipoa || reserva?.clima_tipos || [],
  };
}

/** Personalización de bienvenida: la de la primera reserva que tenga imágenes, logo o música */
export function personalizacionDe(reservas) {
  const reserva = (reservas ?? []).find((r) => {
    const p = r.personalizacion;
    return p && (p.imagen1 || p.imagen2 || p.logo || p.musica);
  });
  return reserva?.personalizacion ?? null;
}

/**
 * Todo lo que conviene guardar en el teléfono para ver la reserva sin conexión.
 * Imágenes: la URL. Documentos con ruta: { url, ruta } (si la firma venció se pide un enlace nuevo a la API).
 */
export function archivosParaGuardar(reservas, usuario) {
  const urls = [];
  (reservas ?? []).forEach((reserva) => {
    Object.values(clasificarDocumentos(reserva, usuario)).flat().forEach(({ url, ruta }) => {
      if (url) urls.push(ruta ? { url, ruta } : url);
    });
    destinosDe(reserva).forEach((d) => urls.push(d.urlImagen));
    actividadesOrdenadas(reserva).forEach((a) => urls.push(a.urlFirmada || a.urlImagen));
    const p = reserva.personalizacion;
    if (p) urls.push(p.imagen1, p.imagen2, p.logo, p.musica);
  });
  return urls.filter(Boolean);
}

/* ── Tiempo del viaje ──────────────────────────────────────────────── */

const DIA_MS = 24 * 60 * 60 * 1000;
const inicioDelDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

/**
 * En qué momento está el viaje según las fechas de sus destinos.
 * estado: 'proximo' | 'hoy' | 'en-curso' | 'realizado' | 'sin-fecha'
 * @returns {{ estado: string, texto: string, dias: number|null, inicio: Date|null, fin: Date|null }}
 */
export function estadoViaje(reserva, ahora = new Date()) {
  const fechas = destinosDe(reserva).map((d) => aFecha(d.fechaViaje)).filter(Boolean).sort((a, b) => a - b);
  if (!fechas.length) return { estado: 'sin-fecha', texto: '', dias: null, inicio: null, fin: null };

  const inicio = fechas[0];
  const fin = fechas.at(-1);
  const hoy = inicioDelDia(ahora);
  const dias = Math.round((inicioDelDia(inicio) - hoy) / DIA_MS);

  if (dias > 0) return { estado: 'proximo', texto: dias === 1 ? 'Mañana' : `En ${dias} días`, dias, inicio, fin };
  if (dias === 0) return { estado: 'hoy', texto: '¡Hoy!', dias, inicio, fin };
  if (inicioDelDia(fin) >= hoy) return { estado: 'en-curso', texto: 'En curso', dias, inicio, fin };
  return { estado: 'realizado', texto: 'Realizado', dias, inicio, fin };
}

const PRIORIDAD = { 'en-curso': 0, hoy: 0, proximo: 1, 'sin-fecha': 2, realizado: 3 };

/** Reservas en orden útil: en curso, próximas (la más cercana primero), sin fecha y al final las realizadas */
export function ordenarReservas(reservas, ahora = new Date()) {
  return (reservas ?? [])
    .map((reserva) => ({ reserva, estado: estadoViaje(reserva, ahora) }))
    .sort((a, b) => {
      const prioridad = PRIORIDAD[a.estado.estado] - PRIORIDAD[b.estado.estado];
      if (prioridad) return prioridad;
      const ta = a.estado.inicio?.getTime() ?? 0;
      const tb = b.estado.inicio?.getTime() ?? 0;
      return a.estado.estado === 'realizado' ? tb - ta : ta - tb;
    });
}

/** El viaje que viene (o el que está en curso); null si todos ya pasaron */
export function proximoViaje(reservas, ahora = new Date()) {
  const primero = ordenarReservas(reservas, ahora)[0];
  return primero && ['en-curso', 'hoy', 'proximo'].includes(primero.estado.estado) ? primero : null;
}
