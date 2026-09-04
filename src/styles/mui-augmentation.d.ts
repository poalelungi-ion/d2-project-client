// Named so it does not collide with theme.ts: TypeScript skips an `x.d.ts`
// that sits next to an `x.ts`, treating it as that file's emitted declarations.

/**
 * Mode-resolved tokens that components need at render time but that MUI's own
 * theme has no home for. Reachable in any `sx` callback as `theme.app`.
 */
declare module '@mui/material/styles' {
  interface Theme {
    app: {
      mode: 'light' | 'dark';
      surface: Record<string, string>;
      shadow: Record<string, string>;
      chart: { grid: string; cursor: string };
    };
  }
  interface ThemeOptions {
    app?: Theme['app'];
  }
}

/** Custom variants declared in styles/components.ts. */
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    cta: true;
  }
}

// Card takes its `variant` prop from Paper, so the override goes there.
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    interactive: true;
  }
}

export {};
