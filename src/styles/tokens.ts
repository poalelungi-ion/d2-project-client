import { alpha } from '@mui/material/styles';
import { brand, common, type ByMode } from './colors';

export const radii = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '24px',
  pill: '999px',
} as const;

export const blur = {
  surface: 'blur(20px)',
  heavy: 'blur(40px)',
} as const;

export const shadows = {
  glass: {
    light: `0 8px 32px 0 ${alpha('#1F2687', 0.1)}`,
    dark: `0 8px 32px 0 ${alpha(common.black, 0.5)}`,
  } as ByMode<string>,
  cardHover: {
    light: `0 12px 40px 0 ${alpha(common.black, 0.1)}`,
    dark: `0 12px 40px 0 ${alpha(common.black, 0.6)}`,
  } as ByMode<string>,
  /** Lift on a card the user can click through to a detail screen. */
  lift: {
    light: `0 12px 24px ${alpha(common.black, 0.1)}`,
    dark: `0 12px 24px ${alpha(common.black, 0.5)}`,
  } as ByMode<string>,
  /** Coloured glow that marks the one primary action on a screen. */
  brandGlow: `0 8px 20px ${alpha(brand.main, 0.3)}`,
  avatar: `0 4px 15px ${alpha(common.black, 0.1)}`,
  tooltip: `0 8px 32px ${alpha(common.black, 0.1)}`,
} as const;

export const gradients = {
  page: {
    light: `linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)`,
    dark: `linear-gradient(135deg, #121212 0%, #2A2A2A 100%)`,
  } as ByMode<string>,
  /** The app-bar wordmark, painted through the text. */
  wordmark: `linear-gradient(45deg, ${brand.main} 30%, ${brand.accent} 90%)`,
  navSelected: `linear-gradient(135deg, ${alpha(brand.main, 0.1)}, ${alpha(brand.main, 0.05)})`,
  /** Account avatar: the wordmark gradient, so the initials read as branded
   *  rather than as MUI's default grey placeholder. */
  avatar: `linear-gradient(135deg, ${brand.main} 0%, ${brand.accent} 100%)`,
} as const;

export const layout = {
  drawerWidth: 260,
  /** Sign-in and registration card: wide enough for an email field, no wider. */
  authCardWidth: 440,
  /** Every ag-grid on a list screen. */
  gridHeight: 600,
  /** Main pane top padding, clearing the fixed app bar. */
  contentTop: 10,
  contentPadding: 4,
} as const;

export const transitions = {
  surface: 'all 0.3s ease',
  hover: 'all 0.2s',
  theme: 'background 0.4s ease, color 0.4s ease',
} as const;

export const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(', '),
  mono: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
  /** Display headings: heavy and tightly tracked. */
  displayWeight: 800,
  displayTracking: '-1.5px',
} as const;

export const borders = {
  hairline: (color: string) => `1px solid ${color}`,
  dropZone: (color: string) => `2px dashed ${color}`,
  emphasis: (color: string) => `2px solid ${color}`,
  calloutRule: (color: string) => `4px solid ${color}`,
} as const;

