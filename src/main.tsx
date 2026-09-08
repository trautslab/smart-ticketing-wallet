import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Mount React 19 Application
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register Native Service Worker for PWA Offline-First Execution
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ ServiceWorker registrado con éxito (Alcance:', registration.scope, ')');
      })
      .catch((error) => {
        console.warn('⚠️ Error al registrar ServiceWorker:', error);
      });
  });
}
