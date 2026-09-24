import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../styles/theme';
import { STUDY_PROGRAMS } from '../../utils/studyProgram';
import { StudyProgramSelect } from './StudyProgramSelect';

const renderSelect = (value = '') => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <StudyProgramSelect value={value} onChange={onChange} />
    </ThemeProvider>,
  );
  return onChange;
};

describe('StudyProgramSelect', () => {
  it('opens a sorted predefined list and does not offer a free-text option', () => {
    renderSelect();
    fireEvent.mouseDown(screen.getByLabelText('Study Program'));
    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options.filter((label) => label !== 'Select a study program')).toEqual([
      ...STUDY_PROGRAMS,
    ]);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('reports the chosen programme', () => {
    const onChange = renderSelect('SE Master');
    fireEvent.mouseDown(screen.getByLabelText('Study Program'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Research Methods'));
    expect(onChange).toHaveBeenCalledWith('Research Methods');
  });
});
