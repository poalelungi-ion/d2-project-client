import { describe, expect, it } from 'vitest';
import { firstName, initials } from './userName';

describe('firstName', () => {
  it('takes the first word', () => {
    expect(firstName('Anna Musterfrau')).toBe('Anna');
  });

  it('handles a single-word name', () => {
    expect(firstName('Anna')).toBe('Anna');
  });

  it('ignores surrounding and repeated whitespace', () => {
    expect(firstName('   Anna    Musterfrau  ')).toBe('Anna');
  });

  it('returns an empty string when there is no name to use', () => {
    expect(firstName('')).toBe('');
    expect(firstName(undefined)).toBe('');
    expect(firstName(null)).toBe('');
  });
});

describe('initials', () => {
  it('takes the first and last initial', () => {
    expect(initials('Anna Musterfrau')).toBe('AM');
  });

  it('skips middle names rather than showing three letters', () => {
    expect(initials('Anna Maria Musterfrau')).toBe('AM');
  });

  it('gives one letter for a single-word name', () => {
    expect(initials('Anna')).toBe('A');
  });

  it('upper-cases a lower-cased name', () => {
    expect(initials('anna musterfrau')).toBe('AM');
  });

  it('returns an empty string when there is no name', () => {
    expect(initials('')).toBe('');
    expect(initials(undefined)).toBe('');
  });
});
