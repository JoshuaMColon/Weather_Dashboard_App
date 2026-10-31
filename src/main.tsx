import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'
import { installTooltips } from './lib/tooltip'

// iOS Safari only applies :active styles when a touch listener exists; this makes every tap give feedback.
document.addEventListener('touchstart', () => {}, { passive: true })
installTooltips()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
