/**
 * Express application entry: composition root only (spec.md R4).
 * Assembles global middleware, mounts routers, starts listening.
 * No business logic lives here.
 */
import { pathToFileURL } from 'node:url';
import express from 'express';
import type { Express } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';

/**
 * Builds the app without listening, so tests can exercise the real middleware
 * chain (validation, 404 and the error handler) through supertest.
 */
export function createApp(): Express {
  const app = express();

  // Parse JSON request bodies for all routes.
  app.use(express.json());

  // Mount routers.
  app.use('/api/users', userRouter);
  app.use('/api/auth', authRouter);

  // Unmatched routes get a JSON envelope instead of Express' HTML default.
  app.use(notFoundHandler);

  // Terminal error handler: must be registered last, after every route.
  app.use(errorHandler);

  return app;
}

// Only listen when this file is the process entry point (tsx dev/start);
// importing it from tests must not open a port.
const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  // Port is env-configurable (defaults to 3100; 3000 is often taken by other local projects).
  const port = Number(process.env.PORT ?? 3100);
  createApp().listen(port, () => {
    console.info(`API server listening on http://localhost:${port}`);
  });
}
