import {defineConfig} from 'vite';
export default defineConfig({base:'/jatvet/',build:{rollupOptions:{input:{legacy:'index.html',v4:'v4/index.html',access:'acceso-prueba.html',diagnostic:'v4/diagnostico.html'}}}});
