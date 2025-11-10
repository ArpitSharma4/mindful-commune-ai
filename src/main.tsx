import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { GamificationProvider } from './contexts/GamificationContext'
import './i18n'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GamificationProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <React.Suspense fallback={<div>Loading...</div>}>
          <App />
        </React.Suspense>
      </ThemeProvider>
    </GamificationProvider>
  </React.StrictMode>
);
