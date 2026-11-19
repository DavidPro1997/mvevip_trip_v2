import { describe, expect, it } from 'vitest';
import { claveCache, firmaVencida, urlLocal } from '../src/services/archivos';
import { agruparPorDia } from '../src/services/actividades';
import { diasDelPronostico, wmoAClimaId, wmoEmoji } from '../src/services/clima';
import { claveDia, hora, nombrePropio } from '../src/services/formato';
import { complementosDe, COMPLEMENTOS } from '../src/services/complementos';

describe('archivos de S3', () => {
  const firmada = 'https://mvevipv2.s3.amazonaws.com/PRUEBAS/RESERVAS/x.pdf?AWSAccessKeyId=A&Signature=B%2B&Expires=1';

  it('las URLs de S3 pasan por el proxy con la firma intacta', () => {
    expect(urlLocal(firmada)).toBe('/s3/global/PRUEBAS/RESERVAS/x.pdf?AWSAccessKeyId=A&Signature=B%2B&Expires=1');
    expect(urlLocal('https://mvevipv2.s3.us-west-2.amazonaws.com/a/b.jpg?X-Amz-Signature=1')).toBe('/s3/us-west-2/a/b.jpg?X-Amz-Signature=1');
  });

  it('otros dominios no cambian', () => {
    expect(urlLocal('https://i.insider.com/x.jpg')).toBe('https://i.insider.com/x.jpg');
    expect(urlLocal('')).toBe('');
  });

  it('la llave de la caché ignora la firma (otra firma = mismo archivo)', () => {
    const otraFirma = firmada.replace('Signature=B%2B', 'Signature=ZZZ');
    expect(claveCache(firmada)).toBe(claveCache(otraFirma));
    expect(claveCache(firmada)).not.toContain('Signature');
  });

  it('sin proxy (S3 + CloudFront) la URL queda directa y la llave de caché es la misma', () => {
    expect(urlLocal(firmada, false)).toBe(firmada);
    expect(claveCache(urlLocal(firmada, true))).toBe(claveCache(firmada));
    expect(claveCache(firmada)).toBe('http://localhost/s3/global/PRUEBAS/RESERVAS/x.pdf');
  });

  it('detecta la firma vencida (v2 y v4)', () => {
    const ahora = Date.UTC(2026, 10, 19, 12, 0, 0);
    expect(firmaVencida(firmada, ahora)).toBe(true); // Expires=1
    expect(firmaVencida(`https://h/x.pdf?Expires=${ahora / 1000 + 60}`, ahora)).toBe(false);
    expect(firmaVencida('https://h/x.pdf?X-Amz-Date=20261119T110000Z&X-Amz-Expires=3600', ahora)).toBe(true);
    expect(firmaVencida('https://h/x.pdf?X-Amz-Date=20261119T113000Z&X-Amz-Expires=3600', ahora)).toBe(false);
    expect(firmaVencida('https://img/sin-firma.jpg', ahora)).toBe(false);
  });
});

describe('itinerario', () => {
  it('agrupa por día con número, hora y datos', () => {
    const dias = agruparPorDia([
      { idActividadReserva: 1, nombre: 'Isla Barú', fechaInicio: '2026-07-04 16:59:00', ciudadNombre: 'CARTAGENA', docs: [{}, {}] },
      { idActividadReserva: 2, nombre: 'City tour', fechaInicio: '2026-07-04 09:00:00', ciudad: 'CTG' },
      { idActividadReserva: 3, nombre: 'Playa', fechaInicio: '2026-07-05 10:00:00' },
      { idActividadReserva: 4, nombre: 'Sin fecha' },
    ]);
    expect(dias.map((d) => [d.numero, d.clave, d.actividades.length])).toEqual([
      [1, '2026-07-04', 2],
      [2, '2026-07-05', 1],
      [3, 'sin-fecha', 1],
    ]);
    expect(dias[0].actividades[0]).toMatchObject({ hora: '16:59', ciudad: 'CARTAGENA', documentos: 2 });
    expect(dias[0].actividades[1].ciudad).toBe('CTG');
    expect(dias[2].etiqueta).toBe('Sin fecha');
  });
});

describe('clima', () => {
  it('códigos WMO → tipo de clima del backend', () => {
    expect(wmoAClimaId(0)).toBe(1);
    expect(wmoAClimaId(2)).toBe(3);
    expect(wmoAClimaId(63)).toBe(7);
    expect(wmoAClimaId(81)).toBe(7);
    expect(wmoAClimaId(73)).toBe(9);
    expect(wmoAClimaId(96)).toBe(0);
    expect(wmoAClimaId(99, 40)).toBe(0);
    expect(wmoAClimaId(10, 38)).toBe(11);
    expect(wmoAClimaId(10, 5, -3)).toBe(12);
    expect(wmoEmoji(3)).toBe('☁️');
  });

  it('arma los días del pronóstico', () => {
    const dias = diasDelPronostico(
      { time: ['2026-07-04'], weathercode: [61], temperature_2m_max: [28.4], temperature_2m_min: [22.1] },
      { 7: 'Lluvia' },
    );
    expect(dias).toEqual([{ fecha: '2026-07-04', tempMax: 28.4, tempMin: 22.1, codigo: 61, climaId: 7, emoji: '🌧️', nombre: 'Lluvia' }]);
  });
});

describe('formato', () => {
  it('claveDia y hora', () => {
    expect(claveDia('2026-07-04 23:30:00')).toBe('2026-07-04');
    expect(claveDia('2026-07-04')).toBe('2026-07-04');
    expect(hora('2026-07-04 08:05:00')).toBe('08:05');
    expect(hora('2026-07-04')).toBe('');
  });

  it('nombrePropio', () => {
    expect(nombrePropio('JUAN CARLOS PÉREZ-ÑÁÑEZ')).toBe('Juan Carlos Pérez-Ñáñez');
  });
});

describe('servicios complementarios', () => {
  it('la reserva 364 solo ve la eSIM; las demás todos', () => {
    expect(complementosDe('364').map((c) => c.id)).toEqual(['esim']);
    expect(complementosDe('1')).toHaveLength(COMPLEMENTOS.length);
  });
});
