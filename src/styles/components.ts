import { alpha, darken } from '@mui/material/styles';
import type { Components, Theme } from '@mui/material/styles';
import type { ThemeMode } from '../types';
import {
  brand,
  chart,
  common,
  neutral,
  semantic,
  surfaces,
  text,
} from './colors';
import {
  blur,
  borders,
  gradients,
  layout,
  radii,
  shadows,
  transitions,
  typography,
} from './tokens';

/**
 * Component-level defaults. Anything repeated across more than a couple of
 * call sites belongs here rather than in a component's `sx` -- that is what
 * keeps screens free of literal radii, shadows and colours.
 */
export const buildComponents = (mode: ThemeMode): Components<Theme> => {
  const brandColor = mode === 'light' ? brand.main : brand.mainDark;

  return {
    // Replaces the old src/index.css: the page gradient, the font stack and the
    // ag-grid theming now come from the same tokens as everything else, instead
    // of a parallel stylesheet of CSS variables.
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          minHeight: '100vh',
          fontFamily: typography.fontFamily,
          background: gradients.page[mode],
          backgroundAttachment: 'fixed',
          color: text.primary[mode],
          transition: transitions.theme,
        },
        '.ag-theme-alpine': {
          '--ag-background-color': mode === 'light' ? 'transparent' : surfaces.panel[mode],
          '--ag-foreground-color': text.primary[mode],
          '--ag-header-background-color': surfaces.tableHeader[mode],
          '--ag-header-foreground-color': text.primary[mode],
          '--ag-row-hover-color': surfaces.tableRowHover[mode],
          '--ag-border-color': surfaces.hairline[mode],
          '--ag-row-border-color': surfaces.hairline[mode],
          '--ag-odd-row-background-color': surfaces.tableStripe[mode],
          '& .ag-cell': {
            display: 'flex',
            alignItems: 'center',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: blur.surface,
          WebkitBackdropFilter: blur.surface,
          border: borders.hairline(surfaces.panelBorder[mode]),
          boxShadow: shadows.glass[mode],
          backgroundImage: 'none',
          transition: transitions.surface,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: shadows.cardHover[mode],
          },
        },
      },
      variants: [
        {
          // A card that navigates somewhere when clicked, so it lifts further.
          props: { variant: 'interactive' },
          style: {
            cursor: 'pointer',
            transition: transitions.hover,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: shadows.lift[mode],
            },
          },
        },
      ],
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          overflow: 'hidden',
          borderRadius: radii.md,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      variants: [
        {
          // The single primary action on a screen: filled, rounded, and lit
          // with the brand glow so it reads as the way forward.
          props: { variant: 'cta' },
          style: {
            borderRadius: radii.lg,
            height: 48,
            paddingInline: 24,
            color: common.white,
            boxShadow: shadows.brandGlow,
            backgroundColor: brandColor,
            '&:hover': {
              backgroundColor: darken(brandColor, 0.2),
              boxShadow: shadows.brandGlow,
            },
          },
        },
      ],
    },

    // Every search box, form field and readonly mapping input in the app.
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: radii.lg },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: surfaces.panel[mode],
          borderRadius: radii.lg,
        },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        root: {
          width: layout.drawerWidth,
          flexShrink: 0,
        },
        paper: {
          width: layout.drawerWidth,
          boxSizing: 'border-box',
          background: surfaces.drawer[mode],
          backdropFilter: blur.heavy,
          WebkitBackdropFilter: blur.heavy,
          borderRight: borders.hairline(surfaces.drawerBorder[mode]),
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: surfaces.appBar[mode],
          backdropFilter: blur.surface,
          WebkitBackdropFilter: blur.surface,
          borderBottom: borders.hairline(surfaces.panelBorder[mode]),
          color: text.primary[mode],
        },
      },
    },

    // Severity drives the fill, so a warning toast is no longer painted like an
    // error -- which is what the hand-rolled ternary in App.tsx used to do.
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radii.xl,
          padding: 8,
          minWidth: 400,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 800 },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          width: '100%',
          borderRadius: radii.xl,
          backdropFilter: blur.surface,
          WebkitBackdropFilter: blur.surface,
          color: common.white,
          fontWeight: 600,
        },
        standardSuccess: { backgroundColor: alpha(semantic.success, 0.9) },
        standardError: { backgroundColor: alpha(semantic.error, 0.9) },
        standardWarning: { backgroundColor: alpha(semantic.warning, 0.9) },
        standardInfo: { backgroundColor: alpha(semantic.info, 0.9) },
        icon: { color: 'inherit' },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: radii.lg },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active, &.Mui-completed': { color: brandColor },
        },
      },
    },

    MuiStepLabel: {
      styleOverrides: {
        label: { fontWeight: 600 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? neutral[900] : neutral[800],
          borderRadius: radii.md,
        },
      },
    },
  };
};

/** Mode-resolved tokens hung off the theme for `sx` callbacks to reach. */
export const buildAppTokens = (mode: ThemeMode) => ({
  mode,
  surface: Object.fromEntries(
    Object.entries(surfaces).map(([key, value]) => [key, value[mode]]),
  ) as Record<string, string>,
  shadow: {
    glass: shadows.glass[mode],
    cardHover: shadows.cardHover[mode],
    lift: shadows.lift[mode],
    brandGlow: shadows.brandGlow,
    avatar: shadows.avatar,
    tooltip: shadows.tooltip,
  },
  chart: { grid: chart.grid[mode], cursor: chart.cursor[mode] },
});
