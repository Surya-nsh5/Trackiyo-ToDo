import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Force clear old service workers and cache to fix stale frontend issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Force a clean slate on first load of this new version
if (!localStorage.getItem('v2_migration_complete')) {
  localStorage.clear();
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  localStorage.setItem('v2_migration_complete', 'true');
  window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
