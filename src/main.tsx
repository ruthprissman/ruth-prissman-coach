
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Lovable script tag to enable new features
const lovableScript = document.createElement('script');
lovableScript.src = 'https://cdn.gpteng.co/gptengineer.js';
lovableScript.type = 'module';
document.head.appendChild(lovableScript);

createRoot(document.getElementById("root")!).render(<App />);
