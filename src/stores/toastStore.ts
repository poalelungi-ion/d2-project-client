import { create } from 'zustand';
import type { Toast, ToastSeverity } from '../types';

interface ToastState {
  toast: Toast;
  notify: (message: string, severity?: ToastSeverity) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: { open: false, message: '', severity: 'success' },
  notify: (message, severity = 'success') => set({ toast: { open: true, message, severity } }),
  dismiss: () => set((state) => ({ toast: { ...state.toast, open: false } })),
}));

/** Shorthand for the common `notify(msg, 'error')` call inside stores. */
export const notify = (message: string, severity: ToastSeverity = 'success') =>
  useToastStore.getState().notify(message, severity);
