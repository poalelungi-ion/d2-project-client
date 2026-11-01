import { describe, expect, it } from 'vitest';
import {
  classifyHeaders,
  fieldForHeader,
  headersAreImportable,
  headersFromTabularText,
  normalizeHeader,
} from './columnNames';

describe('normalizeHeader', () => {
  it('trims, collapses spaces, and drops a trailing dot', () => {
    expect(normalizeHeader('  Matrikelnr.  ')).toBe('matrikelnr');
    expect(normalizeHeader('Full  Name')).toBe('full name');
  });
});

describe('fieldForHeader', () => {
  it('standardises the closed alias list onto internal fields', () => {
    expect(fieldForHeader('Name')).toBe('name');
    expect(fieldForHeader('NOTE')).toBe('grade');
    expect(fieldForHeader('Matrikelnummer')).toBe('student_id');
    expect(fieldForHeader('Email')).toBeUndefined();
  });
});

describe('classifyHeaders', () => {
  it('maps FlexNow names and ignores a Passed column', () => {
    const rows = classifyHeaders(['Matrikelnr', 'Name', 'Note', 'Passed']);
    expect(rows.map((row) => row.status)).toEqual(['Mapped', 'Mapped', 'Mapped', 'Ignored']);
    expect(headersAreImportable(rows)).toBe(true);
  });

  it('rejects an unknown header and a duplicate Name', () => {
    expect(classifyHeaders(['Matrikelnr', 'Name', 'Grade', 'Email'])[3].status).toBe(
      'Unrecognized',
    );
    const dup = classifyHeaders(['Matrikelnr', 'Name', 'Full Name', 'Grade']);
    expect(dup[2].status).toBe('Duplicate');
    expect(headersAreImportable(dup)).toBe(false);
  });
});

describe('headersFromTabularText', () => {
  it('reads a TSV header row', () => {
    expect(headersFromTabularText('Matrikelnr\tName\tNote\n1\tAda\t1.0\n')).toEqual([
      'Matrikelnr',
      'Name',
      'Note',
    ]);
  });
});
