import { describe, it, expect } from 'vitest';
import { parseSemester, compareSemesters, averageGradeBySemester } from './semester';

describe('semester parsing and chronological sorting (Ticket #99881)', () => {
  it('parses WiSe and SoSe semester variants accurately', () => {
    // Winter semester starts in autumn of first year (term 2)
    expect(parseSemester('WiSe23/24')).toEqual({ year: 2023, term: 2 });
    expect(parseSemester('WiSe 23/24')).toEqual({ year: 2023, term: 2 });
    expect(parseSemester('WISE_23')).toEqual({ year: 2023, term: 2 });
    expect(parseSemester('WISE_25')).toEqual({ year: 2025, term: 2 });

    // Summer semester starts in spring of year (term 1)
    expect(parseSemester('SoSe24')).toEqual({ year: 2024, term: 1 });
    expect(parseSemester('SoSe 24')).toEqual({ year: 2024, term: 1 });
    expect(parseSemester('SOSE_24')).toEqual({ year: 2024, term: 1 });
    expect(parseSemester('SOSE_25')).toEqual({ year: 2025, term: 1 });
    expect(parseSemester('SOSE_26')).toEqual({ year: 2026, term: 1 });
  });

  it('correctly resolves the alphabetical anomaly by ordering chronologically', () => {
    // Ticket #99881 bug: SoSe24 appeared before WiSe23/24 alphabetically ('S' < 'W')
    // Chronologically, WiSe23/24 happened in late 2023, while SoSe24 happened in early 2024.
    const unsorted = ['SOSE_25', 'WISE_25', 'SOSE_26', 'WiSe23/24', 'SoSe24', 'WiSe24/25'];

    // Standard JavaScript alphabetical sort exhibits the bug:
    const alphaSorted = [...unsorted].sort();
    expect(alphaSorted.indexOf('SoSe24')).toBeLessThan(alphaSorted.indexOf('WiSe23/24'));

    // Chronological comparator fixes the order:
    const chronoSorted = [...unsorted].sort(compareSemesters);
    expect(chronoSorted).toEqual([
      'WiSe23/24', // late 2023
      'SoSe24',    // early 2024
      'WiSe24/25', // late 2024
      'SOSE_25',   // early 2025
      'WISE_25',   // late 2025
      'SOSE_26',   // early 2026
    ]);

    expect(chronoSorted.indexOf('WiSe23/24')).toBeLessThan(chronoSorted.indexOf('SoSe24'));
  });

  it('handles empty and unknown inputs gracefully', () => {
    expect(parseSemester('')).toEqual({ year: 0, term: 0 });
    expect(compareSemesters('', '')).toBe(0);
    expect(compareSemesters('WiSe24', '')).toBeGreaterThan(0);
  });
});

describe('averageGradeBySemester (Ticket #99896)', () => {
  it('averages numeric grades per semester in chronological order', () => {
    const rows = averageGradeBySemester([
      { semester: 'WISE_25', grade: 5.0 },
      { semester: 'SOSE_25', grade: 1.7 },
      { semester: 'SOSE_25', grade: 2.3 },
    ]);
    expect(rows).toEqual([
      { semester: 'SOSE_25', average: 2.0, sittings: 2 },
      { semester: 'WISE_25', average: 5.0, sittings: 1 },
    ]);
  });

  it('skips excused sittings that have no numeric grade', () => {
    const rows = averageGradeBySemester([
      { semester: 'WISE_25', grade: null },
      { semester: 'WISE_25', grade: 2.0 },
    ]);
    expect(rows).toEqual([{ semester: 'WISE_25', average: 2.0, sittings: 1 }]);
  });

  it('returns an empty list when there are no graded sittings', () => {
    expect(averageGradeBySemester([])).toEqual([]);
    expect(averageGradeBySemester([{ semester: 'WISE_25', grade: null }])).toEqual([]);
  });
});
