import { create } from 'zustand';
import type { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'spa_theme_mode';

function loadStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') {
      return raw;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // Ignore localStorage access errors
  }
  return 'light';
}

function persistTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore localStorage persistence errors
  }
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: loadStoredTheme(),
  setMode: (mode) => {
    persistTheme(mode);
    set({ mode });
  },
  toggle: () =>
    set((state) => {
      const nextMode: ThemeMode = state.mode === 'light' ? 'dark' : 'light';
      persistTheme(nextMode);
      return { mode: nextMode };
    }),
}));
