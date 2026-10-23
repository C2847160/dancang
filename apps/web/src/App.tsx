/**
 * Application shell: composition root of the web app.
 * Owns the signed-in user so the sign-in area and the user list render from a
 * single source of truth. Styling stays inline (no CSS files, no UI libraries),
 * matching the rest of the app.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { User } from '@repo/shared-types';
import { IS_MOCK_MODE } from './lib/api';
import LoginPage from './pages/Login';
import UserListPage from './pages/UserList';

const layoutStyle: CSSProperties = {
  padding: '16px',
  fontFamily: 'sans-serif',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  maxWidth: '720px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '18px',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd',
  paddingBottom: '8px',
};

const badgeStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 'normal',
  color: '#8a6d3b',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeeba',
  borderRadius: '10px',
  padding: '2px 8px',
};

const panelStyle: CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '16px',
};

const successStyle: CSSProperties = {
  color: '#1e7e34',
  marginTop: 0,
};

const signOutStyle: CSSProperties = {
  padding: '6px 12px',
  cursor: 'pointer',
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: '16px',
  marginBottom: '8px',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <span>Dancang</span>
        {IS_MOCK_MODE && (
          <span style={badgeStyle} title="No API configured: the page uses built-in demo data">
            demo data
          </span>
        )}
      </header>

      <section style={panelStyle}>
        {currentUser === null ? (
          <LoginPage onSuccess={setCurrentUser} />
        ) : (
          <div>
            <p style={successStyle} role="status">
              Signed in as {currentUser.name} ({currentUser.email})
            </p>
            <button type="button" style={signOutStyle} onClick={() => setCurrentUser(null)}>
              Sign out
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 style={sectionHeadingStyle}>Users</h2>
        <UserListPage />
      </section>
    </div>
  );
}
