import { describe, expect, it } from 'vitest';
import {
  actividadesOrdenadas,
  categoriaExtra,
  clasificarDocumentos,
  climaDe,
  personalizacionDe,
  resumenReserva,
  archivosParaGuardar,
  estadoViaje,
  ordenarReservas,
  proximoViaje,
} from '../src/services/reservas';

const usuario = { idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ' };

const reserva = {
  idReserva: 10,
  destinos: [
    { ciudad: 'Cartagena', fechaViaje: '2026-07-10 10:00:00', urlImagen: 'https://img/ctg.jpg' },
    { ciudad: 'Bogotá', fechaViaje: '2026-07-04 08:00:00', urlImagen: 'https://img/bog.jpg' },
  ],
  viajeros: [
    { idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ', billeteraConjunta: 0, docs: [{ tipoDocumento: 'Pasaporte', urlFirmada: 'u-ana', ruta: 'r-ana' }] },
    { idViajero: 2, nombres: 'LUIS', apellidos: 'GÓMEZ', billeteraConjunta: 1, docs: [{ tipoDocumento: 'Cédula', urlFirmada: 'u-luis', ruta: 'r-luis' }] },
  ],
  urlFirmadaReservaCompleta: 'u-reserva',
  rutaReservaCompleta: 'r-reserva',
  tickets: [
    {
      urlFirmada: 'u-tk1', ruta: 'r-tk1',
      tramos: [{ codigoCiudadSalida: 'UIO', codigoCiudadDestino: 'CTG' }],
      viajeros: [{ idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ' }, { idViajero: 2, nombres: 'LUIS', apellidos: 'GÓMEZ' }],
    },
    {
      urlFirmada: 'u-tk2', ruta: 'r-tk2',
      tramos: [{ codigoCiudadSalida: 'CTG', codigoCiudadDestino: 'UIO' }],
      viajeros: [{ idViajero: 2, nombres: 'LUIS', apellidos: 'GÓMEZ' }],
    },
  ],
  documentos: [
    { idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ', tipoDocumento: 'eSIM Europa', mostrarTrip: 1, docs: [{ urlFirmada: 'u-sim', idTipoDocumento: 20 }] },
    // Factura (tipo 19): nunca se muestra
    { idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ', tipoDocumento: 'Seguro', mostrarTrip: 1, docs: [{ urlFirmada: 'u-factura', idTipoDocumento: 19 }, { urlFirmada: 'u-seguro', idTipoDocumento: 21 }] },
    // No marcado para el trip
    { idViajero: 1, nombres: 'ANA', apellidos: 'PÉREZ', tipoDocumento: 'Boarding', mostrarTrip: 0, docs: [{ urlFirmada: 'u-oculto', idTipoDocumento: 22 }] },
    // De otro viajero
    { idViajero: 2, nombres: 'LUIS', apellidos: 'GÓMEZ', tipoDocumento: 'Traslado', mostrarTrip: 1, docs: [{ urlFirmada: 'u-luis-extra', idTipoDocumento: 23 }] },
  ],
  actividades: [
    { nombre: 'B', fechaInicio: '2026-07-06 09:00:00' },
    { nombre: 'A', fechaInicio: '2026-07-05 16:59:00' },
  ],
  clima: [{ latitud: 1, longitud: 2 }],
  clima_tipos: [{ id: 1, nombre: 'Despejado' }],
};

const urls = (lista) => lista.map((d) => d.url);

describe('clasificarDocumentos', () => {
  it('sin billetera conjunta solo ve lo suyo', () => {
    const docs = clasificarDocumentos(reserva, usuario);
    expect(urls(docs.documentos)).toEqual(['u-ana']);
    expect(docs.documentos[0].titulo).toBe('Pasaporte - ANA PÉREZ');
    expect(urls(docs.hotel)).toEqual(['u-reserva']);
    expect(urls(docs.tickets)).toEqual(['u-tk1']);
    expect(docs.tickets[0].titulo).toBe('UIO → CTG - ANA PÉREZ');
    expect(urls(docs.sim)).toEqual(['u-sim']);
    expect(urls(docs.seguro)).toEqual(['u-seguro']); // la factura (19) no sale
    expect(docs.boarding).toEqual([]); // mostrarTrip = 0
    expect(docs.otro).toEqual([]); // el extra es de otro viajero
  });

  it('con billetera conjunta ve los documentos de todos', () => {
    const docs = clasificarDocumentos(reserva, { idViajero: 2 });
    expect(urls(docs.documentos)).toEqual(['u-ana', 'u-luis']);
    expect(urls(docs.tickets)).toEqual(['u-tk1', 'u-tk2']);
    expect(docs.tickets[0].titulo).toBe('UIO → CTG - ANA PÉREZ, LUIS GÓMEZ');
    expect(urls(docs.otro)).toEqual(['u-luis-extra']);
  });

  it('sin reserva devuelve categorías vacías', () => {
    expect(Object.values(clasificarDocumentos(null, usuario)).flat()).toEqual([]);
  });
});

describe('categoriaExtra', () => {
  it.each([
    ['eSIM', 'sim'],
    ['Boarding Pass', 'boarding'],
    ['Seguro de viaje', 'seguro'],
    ['Travel insurance', 'seguro'],
    ['Traslado', 'otro'],
  ])('%s → %s', (tipo, categoria) => expect(categoriaExtra(tipo)).toBe(categoria));
});

describe('resumenReserva', () => {
  it('une las ciudades y toma la fecha e imagen del destino más temprano', () => {
    const r = resumenReserva(reserva);
    expect(r.id).toBe('10');
    expect(r.titulo).toBe('Cartagena - Bogotá');
    expect(r.imagen).toBe('https://img/bog.jpg');
    expect(r.imagenPortada).toBe('https://img/ctg.jpg');
    expect(r.fecha).toMatch(/2026/);
  });

  it('sin destinos usa la imagen por defecto', () => {
    expect(resumenReserva({ idReserva: 1 })).toMatchObject({ titulo: 'Sin destino', imagen: '/img/headers/avion.jpg', fecha: '' });
  });
});

describe('otros datos de la reserva', () => {
  it('ordena las actividades por fecha', () => {
    expect(actividadesOrdenadas(reserva).map((a) => a.nombre)).toEqual(['A', 'B']);
  });

  it('clima acepta clima_tipos o clima_tipoa', () => {
    expect(climaDe(reserva).tipos).toHaveLength(1);
    expect(climaDe({ clima_tipoa: [{ id: 2 }] }).tipos).toEqual([{ id: 2 }]);
  });

  it('personalización: la primera reserva que tenga contenido', () => {
    expect(personalizacionDe([{ personalizacion: {} }, { personalizacion: { musica: 'm.mp3' } }])).toEqual({ musica: 'm.mp3' });
    expect(personalizacionDe([reserva])).toBeNull();
  });

  it('archivos para guardar: documentos visibles (con su ruta) e imágenes', () => {
    const lista = archivosParaGuardar([reserva], usuario).map((x) => (typeof x === 'string' ? x : x.url));
    expect(archivosParaGuardar([reserva], usuario)).toContainEqual({ url: 'u-ana', ruta: 'r-ana' });
    expect(lista).toEqual(expect.arrayContaining(['u-ana', 'u-reserva', 'u-tk1', 'u-sim', 'u-seguro', 'https://img/ctg.jpg']));
    expect(lista).not.toContain('u-factura');
    expect(lista).not.toContain('u-luis');
  });
});

describe('tiempo del viaje', () => {
  const ahora = new Date(2026, 10, 19, 15, 0); // 19 nov 2026, 15:00
  const viaje = (id, ...fechas) => ({ idReserva: id, destinos: fechas.map((f) => ({ ciudad: id, fechaViaje: f })) });

  it.each([
    [viaje('a', '2026-12-14 10:00:00'), 'proximo', 'En 25 días'],
    [viaje('b', '2026-11-20 01:00:00'), 'proximo', 'Mañana'],
    [viaje('c', '2026-11-19 23:00:00'), 'hoy', '¡Hoy!'],
    [viaje('d', '2026-11-15 08:00:00', '2026-11-22 08:00:00'), 'en-curso', 'En curso'],
    [viaje('e', '2025-07-06 12:30:00'), 'realizado', 'Realizado'],
    [{ idReserva: 'f' }, 'sin-fecha', ''],
  ])('%#', (reserva, estado, texto) => {
    expect(estadoViaje(reserva, ahora)).toMatchObject({ estado, texto });
  });

  it('ordena: en curso, próximos por cercanía, sin fecha y realizados del más reciente', () => {
    const lista = [
      viaje('pasado-viejo', '2024-01-01'),
      viaje('lejano', '2027-03-02'),
      { idReserva: 'sin-fecha' },
      viaje('cercano', '2026-12-01'),
      viaje('pasado-reciente', '2026-10-01'),
      viaje('en-curso', '2026-11-18', '2026-11-25'),
    ];
    expect(ordenarReservas(lista, ahora).map((x) => x.reserva.idReserva)).toEqual([
      'en-curso', 'cercano', 'lejano', 'sin-fecha', 'pasado-reciente', 'pasado-viejo',
    ]);
    expect(proximoViaje(lista, ahora).reserva.idReserva).toBe('en-curso');
    expect(proximoViaje([viaje('x', '2020-01-01')], ahora)).toBeNull();
  });
});
