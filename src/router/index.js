import { createRouter, createWebHistory } from 'vue-router';
import { useSesionStore } from '@/stores/sesion';
import LoginView from '@/views/LoginView.vue';
import InicioView from '@/views/InicioView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/inicio' },
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
    // /home era la ruta del front anterior: se mantiene para los enlaces guardados
    { path: '/inicio', alias: '/home', name: 'inicio', component: InicioView },
    { path: '/reserva/:id', name: 'reserva', component: () => import('@/views/ReservaView.vue'), props: true },
    { path: '/:pathMatch(.*)*', redirect: '/inicio' },
  ],
  scrollBehavior(to, from, guardada) {
    if (guardada) return guardada;
    // Cambiar de pestaña en la reserva (?ver=...): el scroll lo maneja ReservaView
    if (to.name === 'reserva' && from.name === 'reserva' && to.params.id === from.params.id) return false;
    // Enlaces de la cabecera a secciones del inicio (#servicios, #descubre)
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' };
    return { top: 0 };
  },
});

// Sin sesión solo se puede ver el login; con sesión, el login lleva al inicio
router.beforeEach((to) => {
  const sesion = useSesionStore();
  if (!to.meta.publica && !sesion.haySesion) return { name: 'login' };
  if (to.name === 'login' && sesion.haySesion) return { name: 'inicio' };
  return true;
});

export default router;
