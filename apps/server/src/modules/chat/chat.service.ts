/**
 * Chat service: orchestrates the AI layer (spec.md R4 — ai/ is a service-layer
 * implementation detail, only ever reached from services).
 *
 * No HTTP types, no status codes. It takes a validated conversation, asks the
 * configured LLM provider for the next turn, and returns the assistant message.
 */
import type { ChatMessage, ChatRequest, ChatResponse } from './chat.types';
import { getChatProvider } from '../../ai';

/**
 * Sends the conversation to the configured LLM provider and returns the new
 * assistant message. Provider errors surface as thrown Errors, which the
 * global error handler turns into a 500 INTERNAL_ERROR envelope.
 */
export async function sendMessage(input: ChatRequest): Promise<ChatResponse> {
  const provider = getChatProvider();
  const reply: ChatMessage = await provider.chat(input.messages);
  return { message: reply };
}
