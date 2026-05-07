import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

// Custom plugin to route /api to Vercel serverless functions locally
function vercelApiProxyPlugin(): Plugin {
  return {
    name: 'vercel-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            // Parse URL to get path and query
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const pathName = urlObj.pathname;

            // Mock req.query which is provided by Vercel
            // @ts-ignore
            req.query = Object.fromEntries(urlObj.searchParams);

            // Mock res.status and res.json which are provided by Vercel
            // @ts-ignore
            res.status = function(statusCode) {
              res.statusCode = statusCode;
              return res;
            };
            // @ts-ignore
            res.json = function(data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };

            // Map /api/stream -> ./api/stream.js
            // In a real Vercel environment, it maps to exactly the file in the api folder
            const filePath = path.resolve(__dirname, `.${pathName}.js`);

            // Bypass node's module cache for local dev
            const apiModule = await import(`${filePath}?update=${Date.now()}`);

            if (apiModule.default) {
              await apiModule.default(req, res);
              return;
            } else {
              res.statusCode = 500;
              res.end('Serverless function must have a default export.');
              return;
            }
          } catch (err) {
            console.error('Error executing local API proxy:', err);
            res.statusCode = 500;
            res.end('Internal Server Error in local API proxy.');
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), vercelApiProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
