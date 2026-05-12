import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MusicProvider } from './MusicContext.tsx';
import GlobalErrorCatcher from './components/GlobalErrorCatcher.tsx';

// vite-plugin-pwa automatically handles registration with registerType: 'autoUpdate'
// However, we can use the virtual module to explicitly register if needed.
// For now, the plugin injects the registration script automatically,
// so we just remove the old manual sw.js registration.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorCatcher>
      <MusicProvider>
        <App />
      </MusicProvider>
    </GlobalErrorCatcher>
  </StrictMode>,
);
