import { CONTACTO } from '@/services/config';
import { hayInternet } from '@/services/api';
import { useAvisos } from './useAvisos';

/** WhatsApp, llamada y correo de Marketing VIP (WhatsApp necesita internet: si no hay, se avisa). */
export function useContacto() {
  const { sinConexion } = useAvisos();

  const abrirWhatsApp = (mensaje = 'Hola, quiero información sobre sus servicios...') => {
    if (!hayInternet()) return sinConexion();
    const numero = CONTACTO.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
  };

  const abrirEnlace = (url) => {
    if (!hayInternet()) return sinConexion();
    window.open(url, '_blank', 'noopener');
  };

  const llamar = () => {
    window.location.href = `tel:${CONTACTO.telefono}`;
  };

  const enviarCorreo = (asunto = '', cuerpo = '') => {
    window.location.href = `mailto:${CONTACTO.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  return { abrirWhatsApp, abrirEnlace, llamar, enviarCorreo };
}
