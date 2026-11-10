import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline caching and PWA installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, auto-updating cache.');
  },
  onOfflineReady() {
    console.log('Remix Rolodox is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
