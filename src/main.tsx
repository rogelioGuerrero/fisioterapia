import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión de FisioAsistente AI disponible. ¿Desea actualizar?')) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('FisioAsistente AI está listo para uso sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
