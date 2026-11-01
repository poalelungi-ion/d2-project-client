import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import { STUDY_PROGRAM_OPTIONS, suggestClosestStudyProgram } from '../../../utils/studyProgram';
import { StudyProgramResolverDialog } from './StudyProgramResolverDialog';

describe('StudyProgramResolverDialog (#104102: Redesigned Study Program Mapping Workflow)', () => {
  it('suggests the closest standardized study program for unrecognized abbreviations', () => {
    expect(suggestClosestStudyProgram('B.Sc. IMIT-2025')).toBe('IMIT Bachelor');
    expect(suggestClosestStudyProgram('M.Sc. Software Sys')).toBe('SE Master');
    expect(suggestClosestStudyProgram('Master Data Analytics & AI')).toBe('Data Science Master');
    expect(suggestClosestStudyProgram('WiInf M.Sc.')).toBe('Wirtschaftsinformatik Master');
  });

  it('renders side-by-side mapping rows with row counts, bulk assignment, and applies mapped programs', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={getGlassTheme('light')}>
        <StudyProgramResolverDialog
          open={true}
          onClose={onClose}
          unmappedPrograms={['M.Sc. SoftEng', 'B.Sc. IMIT-Neu']}
          existingPrograms={STUDY_PROGRAM_OPTIONS}
          programCounts={{ 'M.Sc. SoftEng': 4, 'B.Sc. IMIT-Neu': 2 }}
          onApply={onApply}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByText(/Study Program Mapping & Normalization/i),
    ).toBeInTheDocument();
    expect(screen.getByText('4 rows')).toBeInTheDocument();
    expect(screen.getByText('2 rows')).toBeInTheDocument();
    expect(screen.getByText(/Quick Bulk Assignment/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply mappings & validate/i }));

    expect(onApply).toHaveBeenCalledWith(
      {
        'M.Sc. SoftEng': 'SE Master',
        'B.Sc. IMIT-Neu': 'IMIT Bachelor',
      },
      [],
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
