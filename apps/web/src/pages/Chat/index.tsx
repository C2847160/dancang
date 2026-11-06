/**
 * Chat page: a minimal conversation UI wired to the useChat hook.
 * Renders the message list, an input, and the request lifecycle (idle / loading / error).
 * Styling stays inline, matching the rest of the app.
 */
import { useState, type CSSProperties, type FormEvent } from 'react';
import { useChat } from './useChat';

const bubbleStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  maxWidth: '80%',
  wordBreak: 'break-word',
};

const userBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  backgroundColor: '#007bff',
  color: '#fff',
  marginLeft: 'auto',
};

const assistantBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  backgroundColor: '#f1f1f1',
  color: '#222',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '320px',
  overflowY: 'auto',
};

const formStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '8px',
};

const sendStyle: CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
};

const errorStyle: CSSProperties = {
  color: '#c0392b',
  margin: '0 0 8px',
};

const emptyStyle: CSSProperties = {
  color: '#888',
  textAlign: 'center',
  padding: '16px',
};

export default function ChatPage() {
  const { messages, status, error, send } = useChat();
  const [draft, setDraft] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    await send(draft);
    setDraft('');
  }

  return (
    <div>
      {messages.length === 0 ? (
        <p style={emptyStyle}>Send a message to start the conversation.</p>
      ) : (
        <ul style={listStyle}>
          {messages.map((msg, i) => (
            <li key={i} style={{ display: 'flex' }}>
              <div style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}>
                {msg.content}
              </div>
            </li>
          ))}
          {status === 'loading' && (
            <li style={{ display: 'flex' }}>
              <div style={assistantBubbleStyle}>…</div>
            </li>
          )}
        </ul>
      )}

      {status === 'error' && error !== null && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}

      <form style={formStyle} onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          type="text"
          value={draft}
          placeholder="Type a message…"
          onChange={(e) => setDraft(e.target.value)}
          disabled={status === 'loading'}
        />
        <button style={sendStyle} type="submit" disabled={status === 'loading'}>
          Send
        </button>
      </form>
    </div>
  );
}
