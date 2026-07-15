import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import StoreContextProvider from './context/StoreContextProvider.jsx'
import ToastProvider from './context/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <StoreContextProvider>
          <App />
        </StoreContextProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
