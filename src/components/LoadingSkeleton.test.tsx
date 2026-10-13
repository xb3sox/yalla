import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  ExperienceCardSkeleton, 
  PlanCardSkeleton, 
  ExplorePageSkeleton, 
  MyPlansPageSkeleton 
} from './LoadingSkeleton';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('LoadingSkeleton Components', () => {
  describe('ExperienceCardSkeleton', () => {
    it('should render without errors', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have correct structure', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const container = document.querySelector('.bg-surface-raised');
      expect(container).toBeTruthy();
    });

    it('should have rounded corners', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const container = document.querySelector('.rounded-2xl');
      expect(container).toBeTruthy();
    });

    it('should have image placeholder', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const imagePlaceholder = document.querySelector('.h-48');
      expect(imagePlaceholder).toBeTruthy();
    });

    it('should have content placeholders', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const contentArea = document.querySelector('.p-4');
      expect(contentArea).toBeTruthy();
    });

    it('should have animate-pulse class', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('PlanCardSkeleton', () => {
    it('should render without errors', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have correct structure', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const container = document.querySelector('.bg-surface-raised');
      expect(container).toBeTruthy();
    });

    it('should have border', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const container = document.querySelector('.border');
      expect(container).toBeTruthy();
    });

    it('should have header placeholder', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const header = document.querySelector('.flex.justify-between');
      expect(header).toBeTruthy();
    });

    it('should have status panel placeholder', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const statusPanel = document.querySelector('.h-20');
      expect(statusPanel).toBeTruthy();
    });

    it('should have action buttons placeholder', () => {
      renderWithProvider(<PlanCardSkeleton />);
      const buttons = document.querySelectorAll('.h-8');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('ExplorePageSkeleton', () => {
    it('should render without errors', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have page header placeholder', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const header = document.querySelector('.mb-6');
      expect(header).toBeTruthy();
    });

    it('should have title placeholder', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const title = document.querySelector('.h-8');
      expect(title).toBeTruthy();
    });

    it('should have subtitle placeholder', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const subtitle = document.querySelector('.h-4');
      expect(subtitle).toBeTruthy();
    });

    it('should have multiple experience card skeletons', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const cards = document.querySelectorAll('.bg-surface-raised.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('should have proper spacing', () => {
      renderWithProvider(<ExplorePageSkeleton />);
      const container = document.querySelector('.px-5.pt-4.pb-28');
      expect(container).toBeTruthy();
    });
  });

  describe('MyPlansPageSkeleton', () => {
    it('should render without errors', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have page header placeholder', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const header = document.querySelector('.mb-6');
      expect(header).toBeTruthy();
    });

    it('should have title placeholder', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const title = document.querySelector('.h-8');
      expect(title).toBeTruthy();
    });

    it('should have section placeholders', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const sections = document.querySelectorAll('.space-y-3');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have multiple plan card skeletons', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const cards = document.querySelectorAll('.bg-surface-raised.rounded-xl');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });

    it('should have proper spacing', () => {
      renderWithProvider(<MyPlansPageSkeleton />);
      const container = document.querySelector('.px-5.pt-4.pb-28');
      expect(container).toBeTruthy();
    });
  });

  describe('Skeleton Component', () => {
    it('should render with custom className', () => {
      const { container } = renderWithProvider(<div className="test-class" />);
      expect(container.querySelector('.test-class')).toBeTruthy();
    });

    it('should have animate-pulse class', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have bg-border class', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const skeletons = document.querySelectorAll('.bg-border');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have rounded-lg class', () => {
      renderWithProvider(<ExperienceCardSkeleton />);
      const skeletons = document.querySelectorAll('.rounded-lg');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
