/**
 * Clima del viaje (port de renderClima): pronóstico de Open-Meteo, nombre de la ciudad con
 * Nominatim y recomendaciones del backend por tipo de clima.
 * El resultado se guarda por reserva para mostrarlo sin conexión.
 */
import { recomendacionesClima } from './api';
import { LLAVES, guardar, leer } from './almacenamiento';

/** Código WMO → id de tipo de clima del backend */
export function wmoAClimaId(codigo, tempMax, tempMin) {
  if (codigo >= 95) return 0; // Tormenta
  if (codigo === 0) return 1; // Despejado
  if (codigo === 1) return 2; // Mayormente despejado
  if (codigo === 2) return 3; // Parcialmente nublado
  if (codigo === 3) return 4; // Nublado
  if (codigo >= 45 && codigo <= 48) return 5; // Neblina
  if (codigo >= 51 && codigo <= 57) return 6; // Llovizna
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return 7; // Lluvia
  if ((codigo >= 71 && codigo <= 77) || (codigo >= 85 && codigo <= 86)) return 9; // Nieve
  if (typeof tempMax === 'number' && tempMax > 35) return 11; // Calor extremo
  if (typeof tempMin === 'number' && tempMin < 0) return 12; // Frío extremo
  return 1;
}

export function wmoEmoji(codigo) {
  if (codigo === 0) return '☀️';
  if (codigo === 1) return '🌤️';
  if (codigo === 2) return '⛅';
  if (codigo === 3) return '☁️';
  if (codigo >= 45 && codigo <= 48) return '🌫️';
  if (codigo >= 51 && codigo <= 57) return '🌦️';
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return '🌧️';
  if ((codigo >= 71 && codigo <= 77) || (codigo >= 85 && codigo <= 86)) return '❄️';
  if (codigo >= 95) return '⛈️';
  return '🌡️';
}

/** Pronóstico diario de Open-Meteo → días con su tipo de clima */
export function diasDelPronostico(diario, nombresTipo = {}) {
  const fechas = diario?.time ?? [];
  return fechas.map((fecha, i) => {
    const codigo = diario.weathercode?.[i] ?? 0;
    const tempMax = diario.temperature_2m_max?.[i] ?? null;
    const tempMin = diario.temperature_2m_min?.[i] ?? null;
    const climaId = wmoAClimaId(codigo, tempMax, tempMin);
    return { fecha, tempMax, tempMin, codigo, climaId, emoji: wmoEmoji(codigo), nombre: nombresTipo[climaId] || 'Despejado' };
  });
}

async function consultarUbicacion(ubicacion, nombresTipo) {
  const { latitud: lat, longitud: lon } = ubicacion;
  const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  const urlCiudad = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  const [clima, geo] = await Promise.all([
    fetch(urlClima).then((r) => {
      if (!r.ok) throw new Error(`Open-Meteo respondió ${r.status}`);
      return r.json();
    }),
    fetch(urlCiudad).then((r) => r.json()).catch(() => ({})),
  ]);
  const dir = geo?.address;
  const ciudad = dir?.city || dir?.town || dir?.village || dir?.county || geo?.display_name || `${lat}, ${lon}`;
  return { ciudad, dias: diasDelPronostico(clima?.daily, nombresTipo) };
}

/**
 * Consulta el clima de todas las ubicaciones y las recomendaciones del backend; lo guarda por reserva.
 * Lanza si no hay conexión o falla Open-Meteo.
 */
export async function consultarClima(idReserva, { ubicaciones, tipos }, token) {
  const nombresTipo = Object.fromEntries((tipos ?? []).map((t) => [t.id, t.nombre || t.tipo || `Tipo ${t.id}`]));
  const lugares = await Promise.all(ubicaciones.map((u) => consultarUbicacion(u, nombresTipo)));

  const idTipos = [...new Set(lugares.flatMap((l) => l.dias.map((d) => d.climaId)))];
  const recomendaciones = {};
  try {
    const datos = await recomendacionesClima(idTipos, token);
    if (datos?.estado && Array.isArray(datos.consulta)) {
      datos.consulta.forEach((r) => {
        (recomendaciones[r.idTipo] ??= []).push(r.recomendacion);
      });
    }
  } catch (e) {
    console.warn('No se pudieron traer las recomendaciones del clima', e);
  }

  const resultado = { lugares, recomendaciones, actualizado: new Date().toISOString() };
  guardar(LLAVES.clima(idReserva), resultado);
  return resultado;
}

export const climaGuardado = (idReserva) => leer(LLAVES.clima(idReserva));
