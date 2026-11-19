import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import './assets/styles/base.css';
import App from './App.vue';
import router from './router';

createApp(App).use(createPinia()).use(router).mount('#app');

if (import.meta.env.PROD) {
  // Service worker: guarda la app para abrirla sin internet y se actualiza sola al publicar una versión nueva
  registerSW({ immediate: true });
} else {
  // En desarrollo no debe quedar ninguno (si no, el navegador muestra una versión vieja guardada)
  navigator.serviceWorker?.getRegistrations().then((lista) => lista.forEach((r) => r.unregister()));
}
