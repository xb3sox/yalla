import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';

import { StaffPage } from './Staff';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    staff: {
      exportCsv: vi.fn(),
      exportExcel: vi.fn(),
    }
  }
}));

describe('StaffPage Export Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mock createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('should render export buttons and call correct API on click', async () => {
    // mock blobs
    const csvBlob = new Blob(['csv content'], { type: 'text/csv' });
    const excelBlob = new Blob(['excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    vi.mocked(api.staff.exportCsv).mockResolvedValue(csvBlob);
    vi.mocked(api.staff.exportExcel).mockResolvedValue(excelBlob);

    renderWithProviders(<StaffPage onBack={() => {}} />, {
      role: 'operations',




    });

    // Navigate to Metrics section to see the buttons
    const metricsTab = screen.getByText('Metrics');
    fireEvent.click(metricsTab);

    // Find export buttons
    const exportCsvBtn = screen.getByText('Export CSV');
    const exportExcelBtn = screen.getByText('Export Excel');

    expect(exportCsvBtn).toBeTruthy();
    expect(exportExcelBtn).toBeTruthy();

    // Test CSV Export
    fireEvent.click(exportCsvBtn);
    expect(exportCsvBtn.hasAttribute('disabled')).toBe(true); // should be loading/disabled
    expect(exportExcelBtn.hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(api.staff.exportCsv).toHaveBeenCalledTimes(1);
    });

    // Test Excel Export
    fireEvent.click(exportExcelBtn);
    await waitFor(() => {
      expect(api.staff.exportExcel).toHaveBeenCalledTimes(1);
    });
  });
});
