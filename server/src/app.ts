import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authRouter } from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './logger';
import { config } from './config';

export const createApp = () => {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const devClientUrl = process.env.VITE_DEV_SERVER ?? 'http://localhost:5173';

  const corsOptions = config.corsOrigins.length
    ? { origin: config.corsOrigins, credentials: false }
    : undefined;

  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    morgan('tiny', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);

  if (isProduction) {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    } else {
      logger.warn('Client build not found; skipping static file hosting.');
    }
  } else {
    const devProxy = createProxyMiddleware({
      target: devClientUrl,
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
      onError: (_err, _req, res) => {
        if (res.headersSent) {
          return;
        }
        res
          .status(502)
          .type('text/html')
          .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Azure Auth API · Dev Mode</title>
    <style>
      body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; margin: 0; }
      main { max-width: 640px; margin: 4rem auto; padding: 2.5rem; border-radius: 1.5rem; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.25); }
      h1 { font-size: 1.75rem; margin-bottom: 1rem; }
      code { font-size: 0.95rem; background: rgba(15, 23, 42, 0.9); padding: 0.25rem 0.5rem; border-radius: 0.5rem; border: 1px solid rgba(148, 163, 184, 0.3); }
      pre { background: rgba(2, 6, 23, 0.8); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.2); }
    </style>
  </head>
  <body>
    <main>
      <h1>Waiting for the Vite dev server…</h1>
      <p>Express will automatically proxy non-API requests to <code>${devClientUrl}</code> once it's online.</p>
      <p>Launch both stacks from the repo root:</p>
      <pre>npm install
npm run dev</pre>
      <p>Or start the UI manually:</p>
      <pre>cd client
npm install
npm run dev</pre>
    </main>
  </body>
</html>`);
      }
    });

    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      return devProxy(req, res, next);
    });
  }

  app.use(errorHandler);

  return app;
};
