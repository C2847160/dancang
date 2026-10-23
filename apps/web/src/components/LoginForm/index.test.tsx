/**
 * Component tests for LoginForm, run in jsdom via vitest.config.ts.
 * Both tests drive the real DOM through Testing Library (user-event), so they
 * exercise the same code path a browser click would.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LoginRequest } from '@repo/shared-types';
import LoginForm from './index';

describe('LoginForm', () => {
  it('reflects typed input in the email and password fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'ada@example.com');
    await user.type(passwordInput, 'correct-horse');

    expect(emailInput).toHaveValue('ada@example.com');
    expect(passwordInput).toHaveValue('correct-horse');
  });

  it('passes the credentials to onSubmit when the button is clicked', async () => {
    const user = userEvent.setup();
    const calls: LoginRequest[] = [];
    const onSubmit = vi.fn((credentials: LoginRequest) => {
      calls.push(credentials);
    });
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([{ email: 'ada@example.com', password: 'correct-horse' }]);
  });
});
