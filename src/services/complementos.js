/** Servicios complementarios que se ofrecen por WhatsApp (los mismos del front anterior). */
export const COMPLEMENTOS = [
  { id: 'esim', titulo: 'eSIM', detalle: 'Mantente conectado', imagen: 'https://i.insider.com/608c561d35c46f0018c0bb1c?width=1200&format=jpeg' },
  { id: 'seguro', titulo: 'Seguro de viaje', detalle: 'Protección durante el viaje', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOJFHut6qWQxX2BNrWn1QUC7xMJQxPgLfjzQ&s' },
  { id: 'actividades', titulo: 'Actividades', detalle: 'Tours y experiencias', imagen: 'https://thumbs.dreamstime.com/b/elegante-experiencia-gastron%C3%B3mica-de-negocios-chef-profesional-que-prepara-comida-gourmet-en-una-estaci%C3%B3n-personal-con-vidrios-y-391222890.jpg' },
  { id: 'vip', titulo: 'Salas VIP', detalle: 'Comodidad y exclusividad', imagen: 'https://aeronotas.com/wp-content/uploads/2022/09/Salon-Admirals-Club-de-AA.jpg' },
  { id: 'dias_extra', titulo: 'Días extra', detalle: 'Extiende tu estadía', imagen: 'https://www.clarin.com/img/2021/06/11/o3BCiMjVA_1256x620__1.jpg' },
  { id: 'migratoria', titulo: 'Orientación migratoria', detalle: 'Acompañamos tu proceso de visa', imagen: 'https://imagenes.primicias.ec/files/image_480_270/uploads/2025/08/22/68a8a5691c2f2.jpeg' },
  { id: 'fast', titulo: 'Fast Track', detalle: 'Evita filas y ahorra tiempo', imagen: 'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_971/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/k40dij9mmfu2c66b1lab/ServicioVIPdelAeropuertoInternacionaldeHangzhouXiaoshan.jpg' },
  { id: 'traslados', titulo: 'Traslados', detalle: 'Aeropuerto ↔ hotel', imagen: 'https://media.tacdn.com/media/attractions-splice-spp-360x240/06/71/93/51.jpg' },
];

// Reservas con una lista propia de servicios (índices de COMPLEMENTOS); el resto ve todos
const POR_RESERVA = { 364: [0] };

export function complementosDe(idReserva) {
  const indices = POR_RESERVA[idReserva];
  return indices ? indices.map((i) => COMPLEMENTOS[i]).filter(Boolean) : COMPLEMENTOS;
}

export const mensajeComplemento = (complemento, idReserva) =>
  `Hola equipo de reservas de Marketing Vip, quisiera adquirir el servicio complementario de ${complemento.titulo} para mi reserva. Mi ID de reserva es: ${idReserva}`;
