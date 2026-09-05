import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeMode } from '../types';
import { buildAppTokens, buildComponents } from './components';
import { buildPalette } from './palette';
import { radii, typography } from './tokens';

/**
 * The glassmorphism theme, assembled from the tokens in this folder. Screens
 * should reach colours and radii through the theme (`sx={{ color: 'grey.600' }}`,
 * component variants, the mixins in ./mixins) rather than importing raw values.
 */
export const getGlassTheme = (mode: ThemeMode): Theme =>
  createTheme({
    palette: buildPalette(mode),
    shape: { borderRadius: parseInt(radii.xl, 10) },
    typography: { fontFamily: typography.fontFamily },
    components: buildComponents(mode),
    app: buildAppTokens(mode),
  });
