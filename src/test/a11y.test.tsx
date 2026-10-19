import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { renderWithProviders } from './utils';
import { LoginPage } from '../pages/Login';
import { ExperienceDetailsPage } from '../pages/ExperienceDetails';
import { MemoryRouter } from 'react-router-dom';

describe('Accessibility tests', () => {
  it('Login page should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ExperienceDetailsPage should have no accessibility violations', async () => {
    // We need a dummy experience in the store to render details.
    // The store starts with initial state having at least one experience.
    const { container } = renderWithProviders(
      <MemoryRouter>
        <ExperienceDetailsPage 
          experienceId="1" 
          onBack={() => {}} 
          onBookSuccess={() => {}} 
        />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
