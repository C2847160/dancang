/**
 * Login page: wires the presentational LoginForm to the real API and renders
 * the full request lifecycle (idle → loading → success / error).
 */
import type { CSSProperties } from 'react';
import type { LoginRequest, User } from '@repo/shared-types';
import LoginForm from '../../components/LoginForm';
import { useLogin } from './useLogin';

interface LoginPageProps {
  /** Called with the authenticated user once the API accepts the credentials. */
  onSuccess: (user: User) => void;
}

const hintStyle: CSSProperties = {
  color: '#777',
  fontSize: '12px',
  maxWidth: '320px',
};

const loadingStyle: CSSProperties = {
  color: '#555',
};

const errorStyle: CSSProperties = {
  color: '#c0392b',
};

const headingStyle: CSSProperties = {
  marginTop: 0,
};

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { status, error, login } = useLogin();

  async function handleSubmit(credentials: LoginRequest): Promise<void> {
    const user = await login(credentials);
    if (user !== null) {
      onSuccess(user);
    }
  }

  return (
    <div>
      <h2 style={headingStyle}>Sign in</h2>

      <LoginForm onSubmit={handleSubmit} />

      {status === 'loading' && (
        <p style={loadingStyle} role="status">
          Checking credentials…
        </p>
      )}

      {status === 'error' && error !== null && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}

      <p style={hintStyle}>
        Demo account: <code>ada@example.com</code> / <code>password123</code>
      </p>
    </div>
  );
}
