import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ProfilProvider } from './context/ProfilContext.jsx'
import { ContenuProvider } from './context/ContenuContext.jsx'
import { ProgressionProvider } from './context/ProgressionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProfilProvider>
      <ContenuProvider>
        <ProgressionProvider>
          <App />
        </ProgressionProvider>
      </ContenuProvider>
    </ProfilProvider>
  </StrictMode>,
)
