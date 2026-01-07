import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './presentation/App.tsx'
import { ThemeProvider } from './presentation/providers/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="reader-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
