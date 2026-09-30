import { create } from 'zustand';
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
  setAccessToken,
  setSessionExpiredHandler,
} from '../api/index';
import { errorDetail } from '../api/errors';
import type {
  AuthenticatedUser,
  LoginPayload,
  RegisterPayload,
  SessionResponse,
} from '../types';

interface AuthState {
  user: AuthenticatedUser | null;
  /**
   * True until the initial refresh attempt settles. The router waits on this
   * so a reload does not flash the login screen at someone who is signed in.
   */
  initializing: boolean;
  /** Set while a login or registration request is in flight. */
  submitting: boolean;
  /** Message from the last failed attempt, rendered under the form. */
  error: string | null;
  restore: () => Promise<void>;
  login: (credentials: LoginPayload) => Promise<boolean>;
  register: (account: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Refresh this many milliseconds before the access token actually expires, so
 * a request is never sent with a token that dies in flight.
 */
const REFRESH_MARGIN_MS = 30_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const cancelScheduledRefresh = (): void => {
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = null;
};

export const useAuthStore = create<AuthState>((set, get) => {
  /**
   * Keeps the session alive in the background.
   *
   * Without this the access token would only be renewed by a request failing
   * with a 401 first, which costs a round trip and would break a long upload
   * mid-flight. The timer is re-armed from each response's expires_in rather
   * than from a constant, so changing ACCESS_TOKEN_TTL_MINUTES on the backend
   * needs no client change.
   */
  const scheduleRefresh = (expiresIn: number): void => {
    cancelScheduledRefresh();
    const delay = Math.max(expiresIn * 1000 - REFRESH_MARGIN_MS, 5_000);
    refreshTimer = setTimeout(() => {
      void (async () => {
        const session = await refreshSession();
        if (session) adoptSession(session);
        else endSession();
      })();
    }, delay);
  };

  const endSession = (): void => {
    cancelScheduledRefresh();
    setAccessToken(null);
    set({ user: null, initializing: false });
  };

  const adoptSession = (session: SessionResponse): void => {
    setAccessToken(session.access_token);
    scheduleRefresh(session.expires_in);
    set({ user: session.user, error: null, initializing: false });
  };

  // A failed refresh inside an ordinary data request ends the session here too,
  // so the guarded routes redirect instead of rendering against a dead token.
  setSessionExpiredHandler(endSession);

  const submit = async (
    send: () => Promise<Response>,
    onSuccess: (body: SessionResponse) => void,
  ): Promise<boolean> => {
    set({ submitting: true, error: null });
    try {
      const res = await send();
      if (res.ok) {
        onSuccess((await res.json()) as SessionResponse);
        return true;
      }
      set({ error: await errorDetail(res) });
    } catch {
      set({ error: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      set({ submitting: false });
    }
    return false;
  };

  return {
    user: null,
    initializing: true,
    submitting: false,
    error: null,

    /**
     * Re-establishes the session on a page load.
     *
     * The access token lives in memory and is gone after a reload, so this
     * trades the httpOnly refresh cookie for a new one. A failure here is the
     * normal "not signed in" case, not an error worth showing.
     */
    restore: async () => {
      const session = await refreshSession();
      if (session) adoptSession(session);
      else endSession();
    },

    login: (credentials) => submit(() => loginRequest(credentials), adoptSession),

    /**
     * Registers and signs straight in, so a new lecturer is not asked for the
     * same password twice in a row.
     */
    register: async (account) => {
      set({ submitting: true, error: null });
      try {
        const res = await registerRequest(account);
        if (!res.ok) {
          set({ error: await errorDetail(res) });
          return false;
        }
      } catch {
        set({ error: 'Could not reach the server. Check your connection and try again.' });
        return false;
      } finally {
        set({ submitting: false });
      }
      return get().login({ email: account.email, password: account.password });
    },

    logout: async () => {
      try {
        // Revokes the refresh token server-side; dropping the cookie alone
        // would leave a usable session behind if the cookie were ever copied.
        await logoutRequest();
      } catch {
        // Signing out locally must succeed even when the server is unreachable.
      }
      endSession();
    },

    clearError: () => set({ error: null }),
  };
});
