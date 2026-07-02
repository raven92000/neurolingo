import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ProfilProvider } from './context/ProfilContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProfilProvider>
      <App />
    </ProfilProvider>
  </StrictMode>,
)
