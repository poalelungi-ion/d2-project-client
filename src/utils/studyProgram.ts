/**
 * Canonical study programs.
 *
 * This is a mirror of the backend's StudyProgram Literal. The upload review
 * grid and the student/course forms only offer these values, so a typed-in
 * Studiengang cannot drift from the list. Change both together.
 */
export const STUDY_PROGRAMS = [
  'Angewandte Informatik Bachelor',
  'Angewandte Informatik Master',
  'Data Science Master',
  'Development Project',
  'IMIT Bachelor',
  'IMIT Master',
  'Informatik',
  'Research Methods',
  'SE Master',
  'Wirtschaftsinformatik Master',
] as const;

export type StudyProgram = (typeof STUDY_PROGRAMS)[number];

/** Fills a blank Studiengang on import rather than failing the row. */
export const UNASSIGNED_PROGRAM = 'Unassigned / Unknown';

/** Upload review options: named programs, then the empty-cell placeholder. */
export const STUDY_PROGRAM_OPTIONS: readonly string[] = [
  ...STUDY_PROGRAMS,
  UNASSIGNED_PROGRAM,
];

export const PROGRAM_ALIASES: Record<string, string> = {
  // SE
  'm.sc. se': 'SE Master',
  'm.sc. software engineering': 'SE Master',
  'm.sc. software eng': 'SE Master',
  'msc se': 'SE Master',
  se: 'SE Master',
  'software engineering': 'SE Master',
  'software engineering master': 'SE Master',

  // Informatik & AINF
  informatik: 'Informatik',
  inf: 'Informatik',
  'b.sc. informatik': 'Angewandte Informatik Bachelor',
  'bsc informatik': 'Angewandte Informatik Bachelor',
  'informatik bachelor': 'Angewandte Informatik Bachelor',
  'm.sc. informatik': 'Angewandte Informatik Master',
  'msc informatik': 'Angewandte Informatik Master',
  'informatik master': 'Angewandte Informatik Master',
  'm.sc. ainf': 'Angewandte Informatik Master',
  'm.sc. angewandte informatik': 'Angewandte Informatik Master',
  'msc ainf': 'Angewandte Informatik Master',
  'ainf master': 'Angewandte Informatik Master',
  ainf: 'Angewandte Informatik Master',
  'angewandte informatik': 'Angewandte Informatik Master',
  'b.sc. ainf': 'Angewandte Informatik Bachelor',
  'bsc ainf': 'Angewandte Informatik Bachelor',
  'angewandte informatik bachelor': 'Angewandte Informatik Bachelor',

  // IMIT
  'm.sc. imit': 'IMIT Master',
  'msc imit': 'IMIT Master',
  'imit master': 'IMIT Master',
  imit: 'IMIT Master',
  'informationsmanagement und informationstechnologie': 'IMIT Master',
  informationsmanagement: 'IMIT Master',
  'b.sc. imit': 'IMIT Bachelor',
  'bsc imit': 'IMIT Bachelor',
  'imit bachelor': 'IMIT Bachelor',

  // WiInf
  'm.sc. wiinf': 'Wirtschaftsinformatik Master',
  'msc wiinf': 'Wirtschaftsinformatik Master',
  'wiinf master': 'Wirtschaftsinformatik Master',
  wiinf: 'Wirtschaftsinformatik Master',
  wirtschaftsinformatik: 'Wirtschaftsinformatik Master',

  // Data Science
  'm.sc. data science': 'Data Science Master',
  'msc data science': 'Data Science Master',
  'data science': 'Data Science Master',
  'data analytics': 'Data Science Master',
  'm.sc. data analytics': 'Data Science Master',
};

const STORAGE_KEY = 'spa_study_program_aliases';

export const getEffectiveAliases = (): Record<string, string> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed as Record<string, string>;
        }
      }
    }
  } catch {
    // Ignore
  }
  return PROGRAM_ALIASES;
};

export const normalizeStudyProgram = (value: string): string => {
  if (!value) return UNASSIGNED_PROGRAM;
  const clean = value.trim();
  if (!clean || clean.toLowerCase() === 'nan') return UNASSIGNED_PROGRAM;
  if (STUDY_PROGRAM_OPTIONS.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  const aliases = getEffectiveAliases();
  if (aliases[lower]) return aliases[lower];
  return clean;
};

export const isAllowedStudyProgram = (
  value: string,
  dynamicPrograms: readonly string[] = [],
): boolean => {
  const norm = normalizeStudyProgram(value);
  return (
    STUDY_PROGRAM_OPTIONS.includes(norm) ||
    dynamicPrograms.includes(value) ||
    dynamicPrograms.includes(norm)
  );
};

/** Review-grid copy: a wrong study program is invalid, not missing. */
export const formatValidationIssues = (
  missing: string[] = [],
  invalid: string[] = [],
): string | null => {
  if (missing.length === 0 && invalid.length === 0) return null;
  const parts: string[] = [];
  if (missing.length > 0) parts.push(`Missing: ${missing.join(', ')}`);
  if (invalid.length > 0) parts.push(`Invalid: ${invalid.join(', ')}`);
  return parts.join('. ');
};
