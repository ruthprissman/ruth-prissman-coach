
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

function renderApp() {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }
    
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
  } catch (error) {
    console.error("Failed to render application:", error);
    
    // Create fallback UI for critical errors
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="font-family: system-ui; padding: 20px; text-align: center;">
          <h2>אירעה שגיאה</h2>
          <p>משהו השתבש בטעינת האפליקציה. אנא נסה לרענן את הדף.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4A235A; color: white; border: none; border-radius: 4px; cursor: pointer;">
            רענן דף
          </button>
          <div style="margin-top: 20px; padding: 10px; background: #f7f7f7; border-radius: 4px; text-align: left; direction: ltr;">
            <p style="font-family: monospace; font-size: 12px;">${error}</p>
          </div>
        </div>
      `;
    }
  }
}

renderApp();
