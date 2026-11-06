/**
 * Chat controller: HTTP boundary only (spec.md R4).
 * Parses the (already-validated) request, delegates to the service, maps the
 * result to status/body.
 */
import type { Request, Response } from 'express';
import type { ChatRequest, ChatResponse } from './chat.types';
import * as chatService from './chat.service';

/** POST / — send a conversation, get the assistant's reply. */
export async function sendMessage(
  req: Request<Record<string, string>, ChatResponse, ChatRequest>,
  res: Response<ChatResponse>,
): Promise<void> {
  const result = await chatService.sendMessage(req.body);
  res.json(result);
}
