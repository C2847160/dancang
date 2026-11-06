/**
 * Chat contract types (contract layer).
 * Rules (spec.md R2.5): type-only — no runtime logic, no runtime dependencies.
 */

/** Who authored a chat message. The `system` role is reserved for provider
 *  instructions and is never sent from the client. */
export type ChatRole = 'system' | 'user' | 'assistant';

/** A single turn in a conversation. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Request body for POST /api/chat. `messages` is the full conversation so far. */
export interface ChatRequest {
  messages: ChatMessage[];
}

/** Response body for POST /api/chat. The new assistant message only. */
export interface ChatResponse {
  message: ChatMessage;
}
