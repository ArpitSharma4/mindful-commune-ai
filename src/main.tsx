import React from 'react' // <-- Add this
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'

// --- ADD THIS IMPORT ---
import './i18n'

createRoot(document.getElementById("root")!).render(
  // It's good practice to wrap everything in StrictMode
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* --- WRAP YOUR APP IN SUSPENSE --- */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <App />
      </React.Suspense>
    </ThemeProvider>
  </React.StrictMode>
);
