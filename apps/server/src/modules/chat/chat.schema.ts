/**
 * Runtime validation schemas for the chat module.
 * Mirrors the contract types in @repo/shared-types (spec.md R2.2): the
 * contract stays type-only, the runtime checks live here on the server.
 */
import { z } from 'zod';
import type { ChatRequest } from './chat.types';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Conversation is too long (max 100 messages)'),
}) satisfies z.ZodType<ChatRequest>;
