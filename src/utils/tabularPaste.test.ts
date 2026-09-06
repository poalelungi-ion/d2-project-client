import { describe, expect, it } from 'vitest';
import { isTabularPaste } from './tabularPaste';

describe('isTabularPaste', () => {
  it('accepts tab-separated cells copied from a spreadsheet', () => {
    expect(
      isTabularPaste('Matrikelnr\tName\tGrade\n12345\tSchneider, Lena\t1.7'),
    ).toBe(true);
  });

  it('accepts comma-separated and semicolon-separated rows', () => {
    expect(isTabularPaste('Matrikelnr,Name,Grade\n1,Ada,1.0')).toBe(true);
    expect(isTabularPaste('Matrikelnr;Name;Grade\n1;Ada;1.0')).toBe(true);
  });

  it('rejects empty or non-tabular paste', () => {
    expect(isTabularPaste('')).toBe(false);
    expect(isTabularPaste('   \n  ')).toBe(false);
    expect(isTabularPaste('just a sentence with no columns')).toBe(false);
  });
});
