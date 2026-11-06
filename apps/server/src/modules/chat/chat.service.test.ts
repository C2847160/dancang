/**
 * Chat service tests. The default provider is MockChatProvider, so these run
 * without any network or API key.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { resetChatProvider } from '../../ai';
import * as chatService from './chat.service';

beforeEach(() => {
  resetChatProvider();
});

describe('chatService.sendMessage', () => {
  it('returns an assistant message echoing the last user message', async () => {
    const response = await chatService.sendMessage({
      messages: [{ role: 'user', content: 'Hello there' }],
    });

    expect(response.message).toEqual({
      role: 'assistant',
      content: '[mock] You said: "Hello there"',
    });
  });

  it('uses the latest user message when the conversation has many turns', async () => {
    const response = await chatService.sendMessage({
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' },
      ],
    });

    expect(response.message.role).toBe('assistant');
    expect(response.message.content).toContain('Second question');
  });

  it('falls back to a default reply when there is no user message', async () => {
    const response = await chatService.sendMessage({
      messages: [{ role: 'assistant', content: 'Hi' }],
    });

    expect(response.message.role).toBe('assistant');
    expect(response.message.content).toBe('[mock] You said: "Hello"');
  });
});
