/**
 * AI layer public surface (spec.md R4: services import from here only).
 *
 * Selects a concrete provider based on the LLM_PROVIDER environment variable.
 * Defaults to `mock` so the server boots with zero configuration.
 *
 *   LLM_PROVIDER=mock    -> MockChatProvider (default, no network)
 *   LLM_PROVIDER=openai  -> OpenAiChatProvider (needs OPENAI_API_KEY)
 */
import type { ChatProvider } from './provider';
import { MockChatProvider } from './providers/mock-provider';
import { OpenAiChatProvider } from './providers/openai-provider';

export type { ChatProvider } from './provider';

let cached: ChatProvider | undefined;

/** Returns the configured chat provider, cached for the process lifetime. */
export function getChatProvider(): ChatProvider {
  if (cached !== undefined) {
    return cached;
  }
  const kind = process.env.LLM_PROVIDER ?? 'mock';
  switch (kind) {
    case 'openai':
      cached = new OpenAiChatProvider();
      break;
    case 'mock':
    default:
      cached = new MockChatProvider();
      break;
  }
  return cached;
}

/** Test helper: reset the cached provider so a new one is built next call. */
export function resetChatProvider(): void {
  cached = undefined;
}
