import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip, FilterChips } from './FilterChip';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('FilterChip Component', () => {
  it('should render with label', () => {
    renderWithProvider(
      <FilterChip label="Test Filter" active={false} onClick={() => {}} />
    );
    expect(screen.getByText('Test Filter')).toBeTruthy();
  });

  it('should render as inactive by default', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('bg-surface-raised')).toBe(true);
  });

  it('should render as active when active prop is true', () => {
    renderWithProvider(
      <FilterChip label="Test" active={true} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('bg-brand-500')).toBe(true);
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={onClick} />
    );
    
    fireEvent.click(screen.getByText('Test'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have aria-pressed attribute', () => {
    renderWithProvider(
      <FilterChip label="Test" active={true} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should have correct aria-pressed when inactive', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.getAttribute('aria-pressed')).toBe('false');
  });

  it('should show remove button when removable and active', () => {
    const onRemove = vi.fn();
    renderWithProvider(
      <FilterChip 
        label="Test" 
        active={true} 
        onClick={() => {}} 
        removable={true}
        onRemove={onRemove}
      />
    );
    
    const removeButton = screen.getByLabelText('Remove filter');
    expect(removeButton).toBeTruthy();
  });

  it('should not show remove button when not active', () => {
    renderWithProvider(
      <FilterChip 
        label="Test" 
        active={false} 
        onClick={() => {}} 
        removable={true}
        onRemove={() => {}}
      />
    );
    
    expect(screen.queryByLabelText('Remove filter')).toBeNull();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    renderWithProvider(
      <FilterChip 
        label="Test" 
        active={true} 
        onClick={() => {}} 
        removable={true}
        onRemove={onRemove}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Remove filter'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when remove button is clicked', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    renderWithProvider(
      <FilterChip 
        label="Test" 
        active={true} 
        onClick={onClick} 
        removable={true}
        onRemove={onRemove}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Remove filter'));
    expect(onClick).not.toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalled();
  });

  it('should have rounded-full class', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('rounded-full')).toBe(true);
  });

  it('should have proper padding', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('px-3')).toBe(true);
    expect(chip?.classList.contains('py-1.5')).toBe(true);
  });

  it('should have transition classes', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('transition-all')).toBe(true);
  });

  it('should have hover effect when inactive', () => {
    renderWithProvider(
      <FilterChip label="Test" active={false} onClick={() => {}} />
    );
    const chip = screen.getByText('Test').closest('button');
    expect(chip?.classList.contains('hover:border-brand-300')).toBe(true);
  });
});

describe('FilterChips Component', () => {
  const mockFilters = [
    { id: 'filter1', label: 'Filter 1', active: false },
    { id: 'filter2', label: 'Filter 2', active: true },
    { id: 'filter3', label: 'Filter 3', active: false },
  ];

  it('should render all filters', () => {
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={() => {}} />
    );
    
    expect(screen.getByText('Filter 1')).toBeTruthy();
    expect(screen.getByText('Filter 2')).toBeTruthy();
    expect(screen.getByText('Filter 3')).toBeTruthy();
  });

  it('should call onToggle with correct id when filter is clicked', () => {
    const onToggle = vi.fn();
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={onToggle} />
    );
    
    fireEvent.click(screen.getByText('Filter 1'));
    expect(onToggle).toHaveBeenCalledWith('filter1');
  });

  it('should show clear all button when there are active filters', () => {
    const onClearAll = vi.fn();
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={() => {}} onClearAll={onClearAll} />
    );
    
    expect(screen.getByText('Clear all')).toBeTruthy();
  });

  it('should not show clear all button when there are no active filters', () => {
    const filters = [
      { id: 'filter1', label: 'Filter 1', active: false },
      { id: 'filter2', label: 'Filter 2', active: false },
    ];
    
    renderWithProvider(
      <FilterChips filters={filters} onToggle={() => {}} onClearAll={() => {}} />
    );
    
    expect(screen.queryByText('Clear all')).toBeNull();
  });

  it('should call onClearAll when clear all button is clicked', () => {
    const onClearAll = vi.fn();
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={() => {}} onClearAll={onClearAll} />
    );
    
    fireEvent.click(screen.getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('should have flex wrap layout', () => {
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={() => {}} />
    );
    
    const container = document.querySelector('.flex.items-center.gap-2.flex-wrap');
    expect(container).toBeTruthy();
  });

  it('should render with proper spacing', () => {
    renderWithProvider(
      <FilterChips filters={mockFilters} onToggle={() => {}} />
    );
    
    const container = document.querySelector('.gap-2');
    expect(container).toBeTruthy();
  });

  it('should handle empty filters array', () => {
    renderWithProvider(
      <FilterChips filters={[]} onToggle={() => {}} />
    );
    
    // Should not crash
    expect(document.querySelector('.flex.items-center')).toBeTruthy();
  });

  it('should handle single filter', () => {
    const filters = [{ id: 'filter1', label: 'Single Filter', active: false }];
    
    renderWithProvider(
      <FilterChips filters={filters} onToggle={() => {}} />
    );
    
    expect(screen.getByText('Single Filter')).toBeTruthy();
  });

  it('should handle all filters active', () => {
    const filters = [
      { id: 'filter1', label: 'Filter 1', active: true },
      { id: 'filter2', label: 'Filter 2', active: true },
    ];
    
    renderWithProvider(
      <FilterChips filters={filters} onToggle={() => {}} onClearAll={() => {}} />
    );
    
    expect(screen.getByText('Clear all')).toBeTruthy();
  });
});
