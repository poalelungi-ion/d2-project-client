import type { SxProps, Theme } from '@mui/material/styles';
import { badge, semantic, tint, wash } from './colors';
import { borders, gradients, radii, shadows, typography } from './tokens';

/**
 * Reusable `sx` fragments for patterns that are a *composition* rather than a
 * component -- things a `theme.components` default cannot express because they
 * depend on a value the call site passes in.
 */

/** The h3 + subtitle pair that opens every screen. */
export const pageTitle: SxProps<Theme> = {
  fontWeight: typography.displayWeight,
  letterSpacing: typography.displayTracking,
};

export const pageSubtitle: SxProps<Theme> = {
  color: 'text.secondary',
  fontWeight: 400,
};

/** Drawer entries: pill-shaped, brand-tinted when they own the current route. */
export const navItem = (active: boolean): SxProps<Theme> => ({
  borderRadius: radii.lg,
  '&.Mui-selected': {
    background: gradients.navSelected,
    color: 'primary.main',
  },
  '&:hover': { background: (theme) => theme.app.surface.hover },
  '& .MuiListItemIcon-root': { color: active ? 'primary.main' : 'inherit' },
  '& .MuiTypography-root': { fontWeight: active ? 700 : 500 },
});

/** KPI tile and callout: a 5% wash, a 20% border and the tone at full strength. */
export const toneSurface = (color: string): SxProps<Theme> => {
  const { bg, border } = tint(color);
  return { bgcolor: bg, border: borders.hairline(border) };
};

export const toneValue = (color: string): SxProps<Theme> => ({
  color,
  fontWeight: typography.displayWeight,
});

/** A selectable tile -- demo file, drop zone -- that shows its chosen state. */
export const selectableTile = (selected: boolean, color: string): SxProps<Theme> => ({
  cursor: 'pointer',
  position: 'relative',
  borderRadius: radii.lg,
  borderWidth: selected ? 2 : 1,
  borderColor: selected ? color : (theme) => theme.app.surface.wellBorder,
  bgcolor: selected ? wash(color) : 'background.paper',
});

/** Small metadata pill: semester, id, professor under a card's title. */
export const metaChip: SxProps<Theme> = {
  color: 'text.secondary',
  bgcolor: (theme) => theme.app.surface.well,
  px: 1,
  py: 0.5,
  borderRadius: radii.xs,
};

/** Recessed chip for filenames, ids and other inline monospace values. */
export const monoChip: SxProps<Theme> = {
  bgcolor: (theme) => theme.app.surface.well,
  px: 1.5,
  py: 0.5,
  borderRadius: radii.xs,
  fontFamily: typography.mono,
  fontWeight: 700,
};

/** The small grey caps labels used across the upload wizard's form. */
export const fieldLabel: SxProps<Theme> = {
  fontWeight: 700,
  color: 'grey.500',
  letterSpacing: 1,
  display: 'block',
  mb: 1,
};

/** Segmented control: a solid track holding two or three chip buttons. */
export const segmentedTrack: SxProps<Theme> = {
  display: 'inline-flex',
  bgcolor: (theme) => theme.app.surface.solid,
  borderRadius: radii.md,
  p: 0.5,
};

export const segmentedOption = (active: boolean): SxProps<Theme> => ({
  borderRadius: radii.sm,
  fontWeight: 700,
  color: active ? 'common.white' : 'grey.600',
  bgcolor: active ? 'grey.900' : 'transparent',
  '&:hover': {
    bgcolor: active ? 'grey.900' : (theme) => theme.app.surface.solidHover,
  },
});

/** Amber "needs attention" pill on the demo-file cards. */
export const warningBadge: SxProps<Theme> = {
  bgcolor: badge.surface,
  color: badge.onSurface,
  px: 1.5,
  py: 0.5,
  borderRadius: radii.xs,
  display: 'inline-block',
  fontSize: '0.75rem',
  fontWeight: 700,
};

/** Left-ruled callout for validation problems above the review grid. */
export const errorCallout: SxProps<Theme> = {
  bgcolor: tint(semantic.error).bg,
  borderLeft: borders.calloutRule(semantic.error),
  p: 2,
  borderRadius: radii.xs,
};

/** File drop zone, which colours itself once something is staged. */
export const dropZone = (hasFile: boolean): SxProps<Theme> => ({
  border: (theme) =>
    borders.dropZone(hasFile ? semantic.success : theme.app.surface.wellBorder),
  borderRadius: radii.xl,
  cursor: 'pointer',
  backgroundColor: hasFile ? tint(semantic.success).bg : 'transparent',
  '&:hover': {
    borderColor: 'primary.main',
    backgroundColor: (theme) => wash(theme.palette.primary.main),
  },
});

/** Standard sizing for every ag-grid on a list screen. */
export const gridContainer: SxProps<Theme> = {
  flex: 1,
  width: '100%',
  maxWidth: 1400,
  mt: 2,
};

/** Recharts has no theme access, so its tooltip is styled by hand. */
export const chartTooltip = (theme: Theme) => ({
  background: theme.palette.background.paper,
  border: borders.hairline(theme.app.surface.panelBorder),
  borderRadius: radii.lg,
  boxShadow: shadows.tooltip,
});

