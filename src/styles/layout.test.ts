import { describe, expect, it } from 'vitest';
import { gridContainer, gridFrame, pageShell } from './mixins';
import { layout } from './tokens';

describe('full-viewport layout tokens (#104095)', () => {
  it('keeps data-grid frames full width without a viewport-filling min height', () => {
    expect(layout.gridMinHeight).toBe(480);
    expect(gridContainer).toMatchObject({ width: '100%' });
    expect(gridContainer).not.toHaveProperty('minHeight');
    expect(gridFrame).toMatchObject({ width: '100%' });
    expect(gridFrame).not.toHaveProperty('minHeight');
  });

  it('lets page shells fill the main pane with no max-width cap', () => {
    expect(pageShell).toMatchObject({
      width: '100%',
      maxWidth: 'none',
      flexGrow: 1,
    });
  });
});
