import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AuthProvider } from '@/auth/auth-provider'

import App from './App.tsx'
import './index.css'

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .catch((e) => console.warn('[LOBY] service worker:', e))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
