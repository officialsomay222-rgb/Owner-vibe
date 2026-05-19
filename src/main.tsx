import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MusicProvider } from './MusicContext.tsx';
import GlobalErrorCatcher from './components/GlobalErrorCatcher.tsx';

const AdminPanel = lazy(() => import('./components/AdminPanel'));

// vite-plugin-pwa automatically handles registration with registerType: 'autoUpdate'
// However, we can use the virtual module to explicitly register if needed.
// For now, the plugin injects the registration script automatically,
// so we just remove the old manual sw.js registration.

const root = createRoot(document.getElementById('root')!);

if (window.location.pathname === '/admin') {
  root.render(
    <StrictMode>
      <GlobalErrorCatcher>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#050505] text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d2ff]"></div></div>}>
          <AdminPanel />
        </Suspense>
      </GlobalErrorCatcher>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <GlobalErrorCatcher>
        <MusicProvider>
          <App />
        </MusicProvider>
      </GlobalErrorCatcher>
    </StrictMode>
  );
}
