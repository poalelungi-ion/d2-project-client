import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Autocomplete, Menu, MenuItem, Select, TextField } from '@mui/material';
import { ThemeProvider, decomposeColor } from '@mui/material/styles';

import type { ThemeMode } from '../types';
import { surfaces } from './colors';
import { getGlassTheme } from './theme';
import { shadows } from './tokens';

const paperOf = (listbox: HTMLElement) => listbox.closest('.MuiPaper-root') as HTMLElement;

const expectOpaqueFloatingPaper = (paper: HTMLElement, mode: ThemeMode) => {
  const style = getComputedStyle(paper);
  const { values } = decomposeColor(style.backgroundColor);
  expect(values[3] ?? 1).toBe(1);
  expect(values.slice(0, 3)).toEqual(decomposeColor(surfaces.floating[mode]).values.slice(0, 3));
  expect(style.boxShadow).toBe(shadows.floating[mode]);
};

describe.each<ThemeMode>(['light', 'dark'])('floating surfaces (%s theme)', (mode) => {
  const withTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={getGlassTheme(mode)}>{ui}</ThemeProvider>);

  it('gives an open Select list an opaque paper', () => {
    withTheme(
      <Select value="a" inputProps={{ 'aria-label': 'course' }}>
        <MenuItem value="a">Course A</MenuItem>
        <MenuItem value="b">Course B</MenuItem>
      </Select>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expectOpaqueFloatingPaper(paperOf(screen.getByRole('listbox')), mode);
  });

  it('gives a Menu an opaque paper', () => {
    withTheme(
      <Menu open anchorEl={document.body}>
        <MenuItem>Open course</MenuItem>
      </Menu>,
    );
    expectOpaqueFloatingPaper(paperOf(screen.getByRole('menu')), mode);
  });

  it('gives an Autocomplete popup an opaque paper', () => {
    withTheme(
      <Autocomplete
        open
        options={['Course A', 'Course B']}
        renderInput={(params) => <TextField {...params} label="Course" />}
      />,
    );
    expectOpaqueFloatingPaper(paperOf(screen.getByRole('listbox')), mode);
  });
});
