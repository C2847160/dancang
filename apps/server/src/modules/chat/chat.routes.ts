/**
 * Chat routes: HTTP method/path → controller mappings only.
 * No business logic and no direct service/ai access (spec.md R4).
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { validateBody } from '../../middlewares/validate';
import * as chatController from './chat.controller';
import { chatRequestSchema } from './chat.schema';

// Intended mount point: app.use('/api/chat', chatRouter)
export const chatRouter: ExpressRouter = Router();

chatRouter.post('/', validateBody(chatRequestSchema), chatController.sendMessage);
