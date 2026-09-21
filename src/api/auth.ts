import { post, request } from './client';
import type { AuthenticatedUser, LoginPayload, RegisterPayload, SessionResponse } from '../types';

export type { AuthenticatedUser, LoginPayload, RegisterPayload, SessionResponse };

/**
 * These four all pass skipRefresh: the refresh-and-retry in the client would
 * be meaningless here. A 401 from /login means the password was wrong, and a
 * 401 from /refresh means the session is genuinely over.
 */
export const login = (credentials: LoginPayload): Promise<Response> =>
  post('/auth/login', credentials, { skipRefresh: true });

export const register = (account: RegisterPayload): Promise<Response> =>
  post('/auth/register', account, { skipRefresh: true });

export const logout = (): Promise<Response> =>
  post('/auth/logout', undefined, { skipRefresh: true });

/** Reads the account behind the current access token. */
export const getCurrentUser = (): Promise<Response> =>
  request('/auth/me', { skipRefresh: true });
