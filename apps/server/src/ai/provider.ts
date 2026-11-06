/**
 * AI layer: LLM provider abstraction (spec.md R4).
 *
 * This module is the single entry point to any large-model capability. It is
 * only ever called from service-layer code — never from routes or controllers.
 *
 * The provider interface is intentionally tiny: a conversation goes in, an
 * assistant message comes out. Concrete providers live in ./providers/.
 */
import type { ChatMessage } from '@repo/shared-types';

/** A pluggable LLM backend. Implementations must be stateless across calls. */
export interface ChatProvider {
  /** Send the full conversation and resolve with the assistant's next message. */
  chat(messages: ChatMessage[]): Promise<ChatMessage>;
}
