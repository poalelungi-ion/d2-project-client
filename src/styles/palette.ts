import type { PaletteOptions } from '@mui/material/styles';
import type { ThemeMode } from '../types';
import {
  brand,
  common,
  neutral,
  secondaryAccent,
  semantic,
  surfaces,
  text,
} from './colors';

export const buildPalette = (mode: ThemeMode): PaletteOptions => ({
  mode,
  common,
  grey: neutral,
  primary: { main: mode === 'light' ? brand.main : brand.mainDark },
  secondary: { main: secondaryAccent[mode] },
  success: { main: semantic.success },
  error: { main: semantic.error },
  warning: { main: semantic.warning },
  info: { main: semantic.info },
  divider: surfaces.hairline[mode],
  background: {
    // The gradient lives on <body> (see MuiCssBaseline), so the app surface
    // itself must not paint over it.
    default: 'transparent',
    paper: surfaces.panel[mode],
  },
  text: {
    primary: text.primary[mode],
    secondary: text.secondary[mode],
  },
});
