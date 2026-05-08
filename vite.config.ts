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
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost';
            const urlObj = new URL(req.url, `${protocol}://${host}`);
            const pathName = urlObj.pathname;

            // Mock req.query which is provided by Vercel for Node envs
            // @ts-ignore
            req.query = Object.fromEntries(urlObj.searchParams);

            // Mock res.status and res.json for Node envs
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

            const filePath = path.resolve(__dirname, `.${pathName}.js`);
            const apiModule = await import(`${filePath}?update=${Date.now()}`);

            if (apiModule.default) {
              // Create Web Request for Edge functions
              const headers = new Headers();
              for (const key in req.headers) {
                if (req.headers[key]) {
                  headers.set(key, req.headers[key] as string);
                }
              }
              const webReq = new Request(urlObj.href, {
                method: req.method,
                headers
              });

              // Call handler with both Web Request and Node req/res (for backwards compatibility)
              const result = await apiModule.default(webReq, res);

              // If it returns a Web Response (Edge Runtime)
              if (result instanceof Response) {
                res.statusCode = result.status;
                result.headers.forEach((value, key) => {
                  res.setHeader(key, value);
                });

                if (result.body) {
                  const reader = result.body.getReader();
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                  res.end();
                } else {
                  res.end();
                }
              }
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
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
