/**
 * Custom hook that owns the chat conversation.
 * The request lifecycle lives here so the page renders from plain state.
 * The actual call (real API or built-in demo data) is decided in src/lib/api.ts.
 */
import { useState } from 'react';
import type { ChatMessage } from '@repo/shared-types';
import { chat as chatRequest } from '../../lib/api';

export type ChatStatus = 'idle' | 'loading' | 'error';

export interface UseChatResult {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  /** Sends a user message, appends it, and awaits the assistant's reply. */
  send: (content: string) => Promise<void>;
}

const INITIAL_MESSAGES: ChatMessage[] = [];

/** Manages the conversation list and the in-flight request state. */
export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function send(content: string): Promise<void> {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setStatus('loading');
    setError(null);

    try {
      const response = await chatRequest({ messages: nextMessages });
      setMessages((prev) => [...prev, response.message]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return { messages, status, error, send };
}
