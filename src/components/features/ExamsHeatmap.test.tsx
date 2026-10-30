import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExamsHeatmap, type HeatmapRow } from './ExamsHeatmap';
import { getHeatmapCellStyle, getOrdinal } from '../../utils/heatmap';

describe('getOrdinal', () => {
  it('formats cardinal numbers into English ordinals correctly', () => {
    expect(getOrdinal(1)).toBe('1st');
    expect(getOrdinal(2)).toBe('2nd');
    expect(getOrdinal(3)).toBe('3rd');
    expect(getOrdinal(4)).toBe('4th');
    expect(getOrdinal(11)).toBe('11th');
    expect(getOrdinal(12)).toBe('12th');
    expect(getOrdinal(13)).toBe('13th');
    expect(getOrdinal(14)).toBe('14th');
    expect(getOrdinal(15)).toBe('15th');
    expect(getOrdinal(21)).toBe('21st');
    expect(getOrdinal(22)).toBe('22nd');
  });
});

describe('getHeatmapCellStyle', () => {
  it('returns transparent background for 0 or missing values', () => {
    const style = getHeatmapCellStyle(0, false);
    expect(style.bgcolor).toBe('transparent');
  });

  it('returns distinct color tiers in dark mode', () => {
    const low = getHeatmapCellStyle(1, true);
    const mid = getHeatmapCellStyle(4, true);
    const high = getHeatmapCellStyle(8, true);
    const highest = getHeatmapCellStyle(15, true);

    expect(low.bgcolor).toBe('rgba(34, 197, 94, 0.22)');
    expect(mid.bgcolor).toBe('rgba(34, 197, 94, 0.40)');
    expect(high.bgcolor).toBe('#15803d');
    expect(highest.bgcolor).toBe('#16a34a');
  });

  it('returns distinct color tiers in light mode', () => {
    const low = getHeatmapCellStyle(2, false);
    const mid = getHeatmapCellStyle(5, false);
    const high = getHeatmapCellStyle(9, false);

    expect(low.bgcolor).toBe('#dcfce7');
    expect(mid.bgcolor).toBe('#86efac');
    expect(high.bgcolor).toBe('#22c55e');
  });
});

describe('ExamsHeatmap component', () => {
  const sampleData: HeatmapRow[] = [
    {
      semester: 'SOSE_26',
      total_students: 34,
      distribution: { 4: 1, 5: 1, 6: 3, 14: 2, 15: 1 },
    },
  ];

  it('renders nothing when heatmap data is empty', () => {
    const { container } = render(<ExamsHeatmap heatmapData={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the table with semester and student counts', () => {
    render(<ExamsHeatmap heatmapData={sampleData} />);

    expect(screen.getByText('Semester')).toBeInTheDocument();
    expect(screen.getByText('#Students')).toBeInTheDocument();
    expect(screen.getByText('SOSE_26')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
  });

  it('renders column numbers up to 15', () => {
    render(<ExamsHeatmap heatmapData={sampleData} />);

    expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });
});
