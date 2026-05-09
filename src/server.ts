import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Proxy /api/* requests to external API
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://scarrow-api.striel.xyz',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api': '/api',
    },
  }),
);

/**
 * Serve static files from /browser
 * Cache HTML files briefly (60s), cache CSS/JS/Images for 1 hour
 * Use Cache-Control: no-cache for index.html to ensure fresh loads
 */
app.use((req, res, next) => {
  if (req.path === '/index.html') {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
  } else if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set({
      'Cache-Control': 'public, max-age=3600',
    });
  }
  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1h',
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        });
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
