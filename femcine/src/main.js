import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { ASSETS } from '@/data/assets';
import '@/assets/styles/main.css';

// Los fondos se publican como variables CSS desde el manifiesto, así las rutas viven en un solo lugar.
const root = document.documentElement.style;
root.setProperty('--img-negro', `url("${ASSETS.backgrounds.negro}")`);
root.setProperty('--img-rosa', `url("${ASSETS.backgrounds.rosa}")`);
root.setProperty('--img-foto', `url("${ASSETS.backgrounds.foto}")`);
root.setProperty('--img-transicion', `url("${ASSETS.backgrounds.transicion}")`);

createApp(App).use(router).mount('#app');
