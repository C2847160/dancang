/**
 * User list page.
 * Renders users fetched from GET /api/users via the `useUsers` hook.
 * Styling uses inline style objects only (no CSS files, no UI libraries).
 */
import type { CSSProperties } from 'react';
import type { User } from '@repo/shared-types';
import { useUsers } from './useUsers';

const containerStyle: CSSProperties = {
  padding: '16px',
  fontFamily: 'sans-serif',
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  maxWidth: '720px',
};

const thStyle: CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f5f5f5',
};

const tdStyle: CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px',
};

const avatarStyle: CSSProperties = {
  borderRadius: '50%',
  objectFit: 'cover',
  display: 'block',
};

const errorStyle: CSSProperties = {
  color: '#c0392b',
};

/** Renders the avatar cell; falls back to a dash when `avatarUrl` is absent. */
function renderAvatar(user: User) {
  if (!user.avatarUrl) {
    return <span>—</span>;
  }
  return <img src={user.avatarUrl} alt={user.name} width={32} height={32} style={avatarStyle} />;
}

/** Renders a single user row; `createdAt` is shown as a localized string. */
function renderRow(user: User) {
  return (
    <tr key={user.id}>
      <td style={tdStyle}>{renderAvatar(user)}</td>
      <td style={tdStyle}>{user.id}</td>
      <td style={tdStyle}>{user.email}</td>
      <td style={tdStyle}>{user.name}</td>
      <td style={tdStyle}>{new Date(user.createdAt).toLocaleString()}</td>
    </tr>
  );
}

/** Page component listing users. */
export default function UserListPage() {
  const { users, loading, error } = useUsers();

  if (loading) {
    return <div style={containerStyle}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={errorStyle}>{error}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Avatar</th>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td style={tdStyle} colSpan={5}>
                No users
              </td>
            </tr>
          ) : (
            users.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
}
