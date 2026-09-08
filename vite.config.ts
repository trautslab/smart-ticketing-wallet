process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { onRequestPost as handleVerify } from './functions/api/verify';
import { onRequestGet as handleTicket } from './functions/api/ticket';
import { onRequestGet as handleAudit } from './functions/api/audit';
import { onRequestPost as handleAuth } from './functions/api/auth';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
        const pathname = url.pathname;

        try {
          let chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);
          const bodyText = bodyBuffer.length > 0 ? bodyBuffer.toString('utf-8') : undefined;

          const webRequest = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method !== 'GET' && req.method !== 'HEAD' && bodyText ? bodyText : undefined
          });

          let webResponse: Response | null = null;

          if (pathname === '/api/verify' && req.method === 'POST') {
            webResponse = await handleVerify({ request: webRequest });
          } else if (pathname === '/api/ticket' && req.method === 'GET') {
            webResponse = await handleTicket({ request: webRequest });
          } else if (pathname === '/api/audit' && req.method === 'GET') {
            webResponse = await handleAudit();
          } else if (pathname === '/api/auth' && req.method === 'POST') {
            webResponse = await handleAuth({ request: webRequest });
          }

          if (webResponse) {
            res.statusCode = webResponse.status;
            webResponse.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            const data = await webResponse.text();
            res.end(data);
            return;
          }
        } catch (err: any) {
          console.error('[API Dev Server Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
  },
  server: {
    port: 3000,
    open: false,
  },
});
