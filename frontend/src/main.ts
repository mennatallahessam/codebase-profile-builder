import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/globals.css';
import { registerEcharts } from './plugins/echarts';

const app = createApp(App);
registerEcharts(app);
app.use(router);
app.mount('#app');
