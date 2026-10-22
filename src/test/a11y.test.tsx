import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { renderWithProviders } from './utils';
import { LoginPage } from '../pages/Login';
import { ExperienceDetailsPage } from '../pages/ExperienceDetails';

describe('Accessibility tests', () => {
  it('Login page should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ExperienceDetailsPage should have no accessibility violations', async () => {
    // We need a dummy experience in the store to render details.
    // The store starts with initial state having at least one experience.
    const { container } = renderWithProviders(
      <ExperienceDetailsPage
        experienceId="1"
        onBack={() => {}}
        onBookSuccess={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
