import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { CourseMark } from '../../../types';
import { EditMarkDialog } from './EditMarkDialog';

const sampleMark: CourseMark = {
  result_id: 42,
  student_id: 1001,
  student_name: 'Anna Chiriciuc',
  program: 'SE Master',
  semester: 'WiSe 2024/25',
  grade: 2.3,
  passed: true,
  outcome: 'passed',
  absence_code: null,
  attempt_type: 'Exam 1',
  version: 1,
};

describe('EditMarkDialog (#104109: Free-Form Exam Attempt Field)', () => {
  it('replaces fixed Exam Attempt dropdown with a free-form text input field and saves custom attempt descriptions', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={getGlassTheme('light')}>
        <EditMarkDialog
          open={true}
          mark={sampleMark}
          courseName="Software Architecture"
          availableSemesters={['WiSe 2024/25', 'SoSe 2025']}
          onClose={onClose}
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    const attemptInput = screen.getByLabelText(/exam attempt/i);
    expect(attemptInput).toBeInTheDocument();
    expect(attemptInput.tagName).toBe('INPUT');
    expect(attemptInput).toHaveValue('Exam 1');

    fireEvent.change(attemptInput, {
      target: { value: 'Oral Colloquium Retake' },
    });
    expect(attemptInput).toHaveValue('Oral Colloquium Retake');

    fireEvent.click(screen.getByRole('button', { name: /save grade/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        result_id: 42,
        attempt_type: 'Oral Colloquium Retake',
        grade: 2.3,
      }),
    );
  });
});
