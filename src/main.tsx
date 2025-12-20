import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeGlobalErrorHandlers } from './lib/errorHandler'

// Initialize global error handlers for unhandled promise rejections
// Requirements: 1.4, 2.3, 5.3 - Handle errors globally
initializeGlobalErrorHandlers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
