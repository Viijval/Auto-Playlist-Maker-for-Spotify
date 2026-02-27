import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
// This file is used for vite to bundle everything and run from a single server.
/* 
main.tsx = bootstrapping (mounting to DOM, wrapping with providers)
App.tsx = application logic (routing, pages)
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
