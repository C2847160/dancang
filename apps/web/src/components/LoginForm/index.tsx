/**
 * Login form (email + password + submit).
 * Presentational component: it owns the input state and delegates the actual
 * sign-in call to `onSubmit`, so it can be mounted anywhere and tested without
 * a network. Types come from the contract layer (spec.md R2.2).
 */
import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { LoginRequest } from '@repo/shared-types';

interface LoginFormProps {
  /** Called with the entered credentials when the form is submitted. */
  onSubmit: (credentials: LoginRequest) => void | Promise<void>;
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxWidth: '320px',
  fontFamily: 'sans-serif',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <label style={fieldStyle}>
        Email
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label style={fieldStyle}>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
