/**
 * Converts a positive number to an English ordinal string (e.g. 1 -> 1st, 15 -> 15th).
 */
export function getOrdinal(n: number): string {
  const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
  const suffixes: Record<string, string> = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
  };
  return `${n}${suffixes[pr.select(n)] || 'th'}`;
}

/**
 * Returns theme-adaptive color styling for exam count heatmap cells.
 */
export function getHeatmapCellStyle(value: number, isDark: boolean) {
  if (!value || value === 0) {
    return {
      bgcolor: 'transparent',
      color: 'text.secondary',
      fontWeight: 400,
    };
  }

  if (isDark) {
    if (value <= 2) {
      return {
        bgcolor: 'rgba(34, 197, 94, 0.22)',
        color: '#86efac',
        fontWeight: 700,
      };
    }
    if (value <= 5) {
      return {
        bgcolor: 'rgba(34, 197, 94, 0.40)',
        color: '#bbf7d0',
        fontWeight: 700,
      };
    }
    if (value <= 10) {
      return {
        bgcolor: '#15803d',
        color: '#ffffff',
        fontWeight: 700,
      };
    }
    return {
      bgcolor: '#16a34a',
      color: '#ffffff',
      fontWeight: 800,
    };
  }

  if (value <= 2) {
    return {
      bgcolor: '#dcfce7',
      color: '#14532d',
      fontWeight: 700,
    };
  }
  if (value <= 5) {
    return {
      bgcolor: '#86efac',
      color: '#14532d',
      fontWeight: 700,
    };
  }
  if (value <= 10) {
    return {
      bgcolor: '#22c55e',
      color: '#ffffff',
      fontWeight: 700,
    };
  }
  return {
    bgcolor: '#15803d',
    color: '#ffffff',
    fontWeight: 800,
  };
}
