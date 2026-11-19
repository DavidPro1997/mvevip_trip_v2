/** Configuración de la app (la URL de la API se inyecta al compilar: VITE_API_URL). */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5006').replace(/\/+$/, '');

export const CONTACTO = {
  telefono: '+593987933325',
  email: 'info@mvevip.com',
};

export const REDES = {
  facebook: 'https://www.facebook.com/share/eAaQqQzrMvU7T4MV',
  instagram: 'https://www.instagram.com/marketingvipecuador',
  tiktok: 'https://www.tiktok.com/@marketingvipecuador',
  youtube: 'https://www.youtube.com/channel/UCTb9vJwhQcB7Ea_1va1o7bg',
};

/** Enlaces de la sección "Descubre Marketing VIP" (los mismos del home anterior) */
// Fotos de Unsplash (por ahora). Si no cargan (sin internet), queda el degradado de color.
const foto = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export const ENLACES_MVEVIP = [
  { id: 'inicio', titulo: 'Tu próximo viaje empieza aquí', etiqueta: 'Inicio', detalle: 'Destinos, paquetes y todo lo que hacemos por ti', url: 'https://www.mvevip.com/', imagen: foto('photo-1488646953014-85cb44e25828') },
  { id: 'promociones', titulo: 'Promociones', etiqueta: 'Ofertas', detalle: 'Precios especiales por tiempo limitado', url: 'https://www.mvevip.com/promociones', imagen: foto('photo-1469854523086-cc02fe5d8800') },
  { id: 'catalogos', titulo: 'Catálogos', etiqueta: 'Paquetes', detalle: 'Viajes en pareja, familia o amigos', url: 'https://www.mvevip.com/catalogos', imagen: foto('photo-1530789253388-582c481c54b0') },
  { id: 'bancos', titulo: 'Convenios bancarios', etiqueta: 'Beneficios', detalle: 'Paga con tus tarjetas y ahorra', url: 'https://www.mvevip.com/bancos', imagen: foto('photo-1563013544-824ae1b704d3') },
  { id: 'nosotros', titulo: 'Nosotros', etiqueta: 'Quiénes somos', detalle: 'Conoce al equipo detrás de tus viajes', url: 'https://www.mvevip.com/nosotros', imagen: foto('photo-1522202176988-66273c2fd55f') },
];

export const IMAGEN_RESERVA_POR_DEFECTO = '/img/headers/avion.jpg';

// Fotos de portada (por ahora de Unsplash). Quedan guardadas para verse sin conexión (ver stores/sesion.js).
export const IMAGEN_PORTADA_INICIO = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=75';
export const IMAGEN_PORTADA_LOGIN = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=75';
