/**
 * OpenAI-compatible chat provider (works with OpenAI, DeepSeek, Moonshot,
 * OneAPI, etc. — anything that speaks the /v1/chat/completions protocol).
 *
 * Configuration is entirely via environment variables so no secrets are baked
 * into the codebase:
 *   - OPENAI_API_KEY   (required when this provider is selected)
 *   - OPENAI_BASE_URL  (optional, defaults to https://api.openai.com/v1)
 *   - OPENAI_MODEL     (optional, defaults to gpt-4o-mini)
 *
 * Only the global fetch is used (Node 18+ / 24 native), so no extra runtime
 * dependency is introduced.
 */
import type { ChatMessage } from '@repo/shared-types';
import type { ChatProvider } from '../provider';

interface OpenAiChatMessage {
  role: string;
  content: string;
}

interface OpenAiResponse {
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  error?: { message?: string };
}

export class OpenAiChatProvider implements ChatProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        'OpenAiChatProvider requires an API key. Set OPENAI_API_KEY or pass one to the constructor.',
      );
    }
    this.apiKey = key;
    this.baseUrl = (baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(
      /\/+$/,
      '',
    );
    this.model = model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async chat(messages: ChatMessage[]): Promise<ChatMessage> {
    const body = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content }) as OpenAiChatMessage),
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as OpenAiResponse;
    if (!res.ok) {
      throw new Error(
        `OpenAI request failed (${res.status}): ${data.error?.message ?? res.statusText}`,
      );
    }

    const reply = data.choices?.[0]?.message;
    if (!reply?.content) {
      throw new Error('OpenAI response contained no assistant message');
    }
    return { role: 'assistant', content: reply.content };
  }
}
