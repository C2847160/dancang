/**
 * Express application entry: composition root only (spec.md R4).
 * Assembles global middleware, mounts routers, starts listening.
 * No business logic lives here.
 */
import express from 'express';
import { userRouter } from './modules/user/user.routes';

const app = express();

// Parse JSON request bodies for all routes.
app.use(express.json());

// Mount the user module at /api/users.
app.use('/api/users', userRouter);

// Port is env-configurable (defaults to 3100; 3000 is often taken by other local projects).
const port = Number(process.env.PORT ?? 3100);

app.listen(port, () => {
  console.info(`API server listening on http://localhost:${port}`);
});
