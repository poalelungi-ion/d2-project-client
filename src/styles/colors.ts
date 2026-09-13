import { alpha } from '@mui/material/styles';
import type { StudentStatus, ThemeMode } from '../types';

/** A token that resolves differently in light and dark mode. */
export type ByMode<T> = Record<ThemeMode, T>;

export const common = {
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Deliberately the same ramp MUI ships as `palette.grey`, and fed back into
 * the palette in palette.ts -- so `sx={{ color: 'grey.600' }}` and
 * `neutral[600]` can never drift apart.
 */
export const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
} as const;

export const brand = {
  /** Hildesheim red. */
  main: '#B71C1C',
  /** Lifted for legibility against dark surfaces. */
  mainDark: '#ef4444',
  /** Second stop of the wordmark gradient. */
  accent: '#FF8E53',
} as const;

export const semantic = {
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#FF8F00',
  info: '#1976D2',
  /** Not a status -- the accent the upload wizard uses for its name-split hint. */
  violet: '#673AB7',
  violetStrong: '#512DA8',
} as const;

/** Amber pair for the "unmapped column" badges in the upload wizard. */
export const badge = {
  surface: '#FFF3E0',
  onSurface: '#E65100',
} as const;

export const text: { primary: ByMode<string>; secondary: ByMode<string> } = {
  primary: { light: neutral[900], dark: '#F3F4F6' },
  secondary: { light: alpha(common.black, 0.6), dark: '#9CA3AF' },
};

export const secondaryAccent: ByMode<string> = { light: neutral[800], dark: '#9CA3AF' };

/**
 * The frosted surfaces the whole layout is built from. `panel` is what MUI
 * gets as `background.paper`; the rest are the chrome around it.
 */
export const surfaces: Record<string, ByMode<string>> = {
  panel: { light: alpha(common.white, 0.85), dark: 'rgba(45, 45, 45, 0.85)' },
  appBar: { light: alpha(common.white, 0.8), dark: 'rgba(30, 30, 30, 0.8)' },
  drawer: { light: alpha(common.white, 0.6), dark: 'rgba(35, 35, 35, 0.6)' },
  /** Raised state for drawer items and other hoverable chrome. */
  hover: { light: alpha(common.white, 0.9), dark: 'rgba(60, 60, 60, 0.9)' },
  panelBorder: { light: alpha(common.white, 0.6), dark: alpha(common.white, 0.1) },
  drawerBorder: { light: alpha(common.white, 0.8), dark: alpha(common.white, 0.12) },
  /** Recessed fill for chips, code spans and inline wells sitting on a panel. */
  well: { light: alpha(common.black, 0.05), dark: alpha(common.white, 0.06) },
  wellBorder: { light: alpha(common.black, 0.12), dark: alpha(common.white, 0.16) },
  hairline: { light: alpha(common.black, 0.1), dark: alpha(common.white, 0.12) },
  /** Solid (non-glass) fill for segmented controls and table headers. */
  solid: { light: neutral[100], dark: 'rgba(30, 30, 30, 0.9)' },
  solidHover: { light: neutral[300], dark: 'rgba(70, 70, 70, 0.9)' },
  tableHeader: { light: 'rgba(241, 245, 249, 0.9)', dark: 'rgba(30, 30, 30, 0.9)' },
  tableRowHover: { light: 'rgba(241, 245, 249, 0.6)', dark: 'rgba(60, 60, 60, 0.6)' },
  tableStripe: { light: alpha(common.black, 0.02), dark: alpha(common.black, 0.1) },
};

/**
 * The tint / border / foreground triple every stat card, callout and status
 * badge is built from, so a new tone never has to guess at the alphas.
 */
export const tint = (color: string) => ({
  bg: alpha(color, 0.05),
  border: alpha(color, 0.2),
  fg: color,
});

/** Barely-there wash used to mark a selected drop zone or demo file. */
export const wash = (color: string) => alpha(color, 0.02);

export const PASS_RATE_THRESHOLD = 50;

export const passRateColor = (passRate: number): string =>
  passRate > PASS_RATE_THRESHOLD ? semantic.success : semantic.error;

export const studentStatusColor = (status: StudentStatus): string => {
  switch (status) {
    case 'active':
      return semantic.info;
    case 'graduated':
      return semantic.success;
    default:
      return semantic.error;
  }
};

/**
 * Recharts and ag-grid take literal color strings rather than `sx`, so they
 * read from here instead of going through the MUI palette.
 */
export const chart = {
  bar: semantic.error,
  pass: semantic.success,
  fail: semantic.error,
  excused: semantic.warning,
  /** The one student the user drilled into, against the cohort. */
  highlight: semantic.warning,
  cohort: semantic.info,
  grid: { light: alpha(common.black, 0.1), dark: alpha(common.white, 0.12) } as ByMode<string>,
  cursor: { light: alpha(common.black, 0.05), dark: alpha(common.white, 0.08) } as ByMode<string>,
} as const;

export const gradeOutcomeColor = (outcome: string): string => {
  if (outcome === 'passed') return semantic.success;
  if (outcome === 'excused') return semantic.warning;
  return semantic.error;
};
