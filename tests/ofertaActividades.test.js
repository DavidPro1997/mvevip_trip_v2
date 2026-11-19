import { describe, expect, it } from 'vitest';
import { codigosDeReserva, mensajeActividad, preciosDe, textoPasajeros } from '../src/services/ofertaActividades';

const actividad = {
  id: 42,
  codigoCiudad: 'CUN',
  ciudad: 'CANCUN',
  nombre: 'TOUR A CHICHEN ITZA',
  precioAdulto: 85,
  precioNino: 60.5,
  precioInfante: 0,
  precioTerceraEdad: 0,
  minPasajeros: 2,
  maxPasajeros: 10,
};

describe('actividades de complementa tu viaje', () => {
  it('códigos de la reserva: sin repetir, en mayúsculas y sin el nombre', () => {
    const reserva = { destino: [{ codigo: 'cun' }, { codigo: 'CUN - Cancún' }, { codigo: 'MEX' }, { ciudad: 'Sin código' }] };
    expect(codigosDeReserva(reserva)).toEqual(['CUN', 'MEX']);
    expect(codigosDeReserva(null)).toEqual([]);
  });

  it('solo muestra los precios mayores a cero', () => {
    expect(preciosDe(actividad).map((p) => p.etiqueta)).toEqual(['Adulto', 'Niño']);
    expect(preciosDe(actividad)[1].valor).toBe('$60,50');
  });

  it('texto de pasajeros', () => {
    expect(textoPasajeros(actividad)).toBe('De 2 a 10 personas');
    expect(textoPasajeros({ minPasajeros: 3 })).toBe('Mínimo 3 personas');
    expect(textoPasajeros({})).toBe('');
  });

  it('mensaje de WhatsApp con reserva, cliente y detalle', () => {
    const texto = mensajeActividad(actividad, { idReserva: 1234 }, { nombres: 'ANA MARÍA', apellidos: 'PÉREZ' });
    expect(texto).toContain('• Reserva: #1234');
    expect(texto).toContain('• Cliente: Ana María Pérez');
    expect(texto).toContain('• Actividad: Tour A Chichen Itza (ID 42)');
    expect(texto).toContain('• Ciudad: Cancun (CUN)');
    expect(texto).toContain('• Precio: Adulto $85 · Niño $60,50');
    expect(texto).toContain('• Pasajeros: De 2 a 10 personas');
  });
});
