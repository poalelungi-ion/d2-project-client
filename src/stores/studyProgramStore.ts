import { create } from 'zustand';
import { PROGRAM_ALIASES } from '../utils/studyProgram';

const STORAGE_KEY = 'spa_study_program_aliases';

function loadInitialAliases(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return { ...PROGRAM_ALIASES };
}

function persistAliases(aliases: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases));
  } catch {
    // Ignore localStorage errors
  }
}

interface StudyProgramState {
  aliases: Record<string, string>;
  addAlias: (program: string, rawAlias: string) => boolean;
  removeAlias: (rawAlias: string) => void;
  resetDefaults: () => void;
  getAliasesForProgram: (program: string) => string[];
}

export const useStudyProgramStore = create<StudyProgramState>((set, get) => ({
  aliases: loadInitialAliases(),

  addAlias: (program: string, rawAlias: string): boolean => {
    const cleanAlias = rawAlias.trim().toLowerCase();
    if (!cleanAlias || !program) return false;

    const current = get().aliases;
    const updated = { ...current, [cleanAlias]: program };
    persistAliases(updated);
    set({ aliases: updated });
    return true;
  },

  removeAlias: (rawAlias: string) => {
    const cleanAlias = rawAlias.trim().toLowerCase();
    const current = { ...get().aliases };
    delete current[cleanAlias];
    persistAliases(current);
    set({ aliases: current });
  },

  resetDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    set({ aliases: { ...PROGRAM_ALIASES } });
  },

  getAliasesForProgram: (program: string): string[] => {
    const aliases = get().aliases;
    return Object.entries(aliases)
      .filter(([_, target]) => target === program)
      .map(([alias]) => alias);
  },
}));

/** Exported helper to query current aliases from anywhere in the codebase */
export const getActiveAliases = (): Record<string, string> => {
  return useStudyProgramStore.getState().aliases;
};
