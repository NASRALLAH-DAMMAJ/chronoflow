import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SupabaseProvider } from './lib/SupabaseContext'
import './lib/i18n'
import App from './App'
import './styles/index.css'
import './design-system/styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>,
)
