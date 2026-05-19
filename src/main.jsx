// main.jsx est le point d'entrée de l'application.
// Il prend le composant App et l'injecte dans le <div id="root">
// de index.html. On ne touche quasiment jamais à ce fichier.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
