/**
 * Mock chat provider: no network, no API key, deterministic replies.
 *
 * Used as the default so the project runs out of the box (demo mode) and so
 * tests don't depend on external services. It echoes the last user message
 * with a short canned prefix, which is enough to exercise the full request
 * path end-to-end.
 */
import type { ChatMessage } from '@repo/shared-types';
import type { ChatProvider } from '../provider';

export class MockChatProvider implements ChatProvider {
  async chat(messages: ChatMessage[]): Promise<ChatMessage> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const echo = lastUser?.content ?? 'Hello';
    return {
      role: 'assistant',
      content: `[mock] You said: "${echo}"`,
    };
  }
}
