import { claveDia, fechaLarga, hora } from './formato';
import { urlLocal } from './archivos';

/**
 * Itinerario agrupado por día (port de renderTimeline).
 * @returns {{ clave: string, numero: number, etiqueta: string, actividades: object[] }[]}
 */
export function agruparPorDia(actividades) {
  const dias = new Map();
  (actividades ?? []).forEach((act) => {
    const clave = claveDia(act.fechaInicio) ?? (act.fechaInicio || 'sin-fecha');
    if (!dias.has(clave)) {
      dias.set(clave, {
        clave,
        etiqueta: claveDia(act.fechaInicio) ? fechaLarga(act.fechaInicio) : act.fechaInicio || 'Sin fecha',
        actividades: [],
      });
    }
    dias.get(clave).actividades.push({
      id: act.idActividadReserva ?? `${clave}-${dias.get(clave).actividades.length}`,
      hora: hora(act.fechaInicio),
      nombre: act.nombre || '',
      imagen: urlLocal(act.urlFirmada || act.urlImagen || ''),
      ciudad: act.ciudadNombre || act.ciudad || '',
      descripcion: act.descripcion || '',
      indicaciones: act.indicaciones || '',
      proveedor: act.proveedor || '',
      documentos: Array.isArray(act.docs) ? act.docs.length : 0,
    });
  });
  return [...dias.values()].map((dia, i) => ({ ...dia, numero: i + 1 }));
}
