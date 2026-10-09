# Contributing to Yalla

Thank you for your interest in contributing to Yalla! This document provides guidelines and information for contributors.

---

## Code of Conduct

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- A code editor (VS Code recommended)
- Basic understanding of React, TypeScript, and Tailwind CSS

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd yalla-mvp

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── domain/             # Business logic (entities, services)
├── application/        # Use cases
├── infrastructure/     # External concerns (mock data)
├── shared/             # Utilities
├── data/               # State management
├── i18n/               # Localization
└── types/              # TypeScript type definitions
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names:

```
feature/add-search-functionality
fix/resolve-booking-error
enhance/improve-loading-states
docs/update-readme
refactor/extract-common-logic
test/add-unit-tests
chore/update-dependencies
jules/<issue-id>-<short-description>  # Autonomous agent branches
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add keyboard shortcuts for navigation
fix: resolve toast notification stacking issue
docs: update README with setup instructions
style: format code with Prettier
refactor: extract search logic into custom hook
test: add unit tests for booking flow
chore: update dependencies
```

### Development Process

1. **Create a branch** from `main`
2. **Make your changes** following our code style
3. **Test your changes** thoroughly
4. **Commit your changes** with clear messages
5. **Push to your branch** and create a pull request
6. **Request review** from team members
7. **Address feedback** and iterate
8. **Merge** after approval

---

## Code Style

### TypeScript

- Use strict mode (already enabled)
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and complex types
- Export types that are used across files

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'participant' | 'host' | 'staff';

// ❌ Bad
const user: any = getUser();
```

### React

- Use functional components with hooks
- Keep components focused and small (< 300 lines)
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props
- Avoid inline styles - use Tailwind classes

```typescript
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, onClick, children }: ButtonProps) {
  return (
    <button onClick={onClick} className={/* ... */}>
      {children}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button style={{ color: 'blue' }}>{props.children}</button>;
}
```

### Tailwind CSS

- Use semantic design tokens (e.g., `text-text-primary`, `bg-surface-raised`)
- Follow mobile-first approach
- Use consistent spacing scale
- Avoid arbitrary values unless necessary
- Group related classes logically

```typescript
// ✅ Good
<div className="bg-surface-raised border border-border rounded-xl p-4">
  <h2 className="text-lg font-semibold text-text-primary">Title</h2>
  <p className="text-sm text-text-secondary mt-2">Description</p>
</div>

// ❌ Bad
<div className="bg-white border border-gray-200 rounded-[13px] p-[17px]">
  <h2 className="text-[17px] font-bold text-black">Title</h2>
  <p className="text-[13px] text-gray-600 mt-[9px]">Description</p>
</div>
```

### Naming Conventions

- **Components**: PascalCase (`ExperienceCard`, `MyPlansPage`)
- **Functions**: camelCase (`handleClick`, `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `BookingState`)
- **Files**: Match the component name (`ExperienceCard.tsx`)

---

## Component Guidelines

### Creating New Components

1. **Check existing components** - Don't duplicate functionality
2. **Keep it focused** - One responsibility per component
3. **Make it reusable** - Accept props for customization
4. **Document it** - Add JSDoc comments for public APIs
5. **Test it** - Write unit tests for logic

### Component Structure

```typescript
import { useState } from 'react';
import { useApp } from '../data/store';

// Props interface
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

/**
 * Brief description of what this component does
 * and when to use it.
 */
export function MyComponent({ title, onAction }: MyComponentProps) {
  const { state } = useApp();
  
  // State and effects
  const [isOpen, setIsOpen] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Accessibility

- Use semantic HTML elements
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works
- Test with screen readers
- Maintain focus management in dialogs
- Use `aria-live` for dynamic content

```typescript
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

<img src={url} alt="Description of image" />

<div role="alert" aria-live="polite">
  {message}
</div>

// ❌ Bad
<button onClick={onClose}>
  <XIcon />
</button>

<img src={url} />

<div>{message}</div>
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

### Writing Tests

- Write tests for all new features
- Aim for 80%+ code coverage
- Test both happy paths and edge cases
- Use descriptive test names
- Mock external dependencies

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test" onAction={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = jest.fn();
    render(<MyComponent title="Test" onAction={onAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
```

---

## Documentation

### Code Comments

- Comment **why**, not **what**
- Document complex logic
- Add JSDoc for public APIs
- Keep comments up-to-date

```typescript
// ✅ Good
// Retry up to 3 times because network calls can fail transiently
const result = await retry(fetchData, 3);

/**
 * Formats a date for display in the user's locale
 * @param date - The date to format
 * @param locale - The user's locale (en or ar)
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: 'en' | 'ar'): string {
  // ...
}

// ❌ Bad
// Increment i by 1
i++;
```

### README Updates

When adding new features, update:
- Feature list in README.md
- Setup instructions if changed
- API documentation if applicable
- CHANGELOG.md

---

## Submitting Changes

### Pull Request Process

1. **Update documentation** - README, CHANGELOG, inline comments
2. **Add tests** - For new features and bug fixes
3. **Check code style** - Run linter and formatter
4. **Test thoroughly** - Manual and automated testing
5. **Create PR** - With clear title and description
6. **Request review** - From at least 2 team members
7. **Address feedback** - Make requested changes
8. **Merge** - After approval and CI passes

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added/updated tests
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Responsive design tested
- [ ] Accessibility verified

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

---

## Review Process

### Reviewer Responsibilities

- Check code quality and style
- Verify tests are adequate
- Ensure documentation is updated
- Test the changes manually
- Provide constructive feedback
- Approve or request changes

### Review Checklist

- [ ] Code is clean and well-organized
- [ ] No unnecessary complexity
- [ ] Tests cover the changes
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Accessibility is maintained
- [ ] Responsive design works
- [ ] No console errors

---

## Design Guidelines

### Using the Design System

- Use existing components when possible
- Follow the design token system
- Maintain consistent spacing
- Use semantic colors
- Test on all screen sizes

### Adding New Components

1. Check if a similar component exists
2. Discuss with the team if creating new
3. Follow component structure guidelines
4. Add to the component library
5. Document usage and props
6. Add stories (if using Storybook)

---

## Localization

### Adding Translations

1. Add keys to `src/i18n/index.ts`
2. Provide both English and Arabic translations
3. Use translation keys in components
4. Test in both languages

```typescript
// In i18n/index.ts
export const translations = {
  en: {
    'my.new.key': 'My new text',
  },
  ar: {
    'my.new.key': 'نصي الجديد',
  },
};

// In component
import { t } from '../i18n';

<p>{t('my.new.key', lang)}</p>
```

---

## Reporting Issues

### Bug Reports

Use the issue template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details
- Console errors

### Feature Requests

Describe:
- The problem you're solving
- Proposed solution
- Alternatives considered
- Benefits to users

---

## Resources

### Documentation

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [axe DevTools](https://www.deque.com/axe/devtools/) (Accessibility)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) (Performance)

---

## Questions?

- Check existing issues and discussions
- Ask in the team chat
- Reach out to maintainers

---

<div align="center">

**Thank you for contributing to Yalla! 🎉**

[README](./README.md) • [PRD](./PRD.md) • [ROADMAP](./ROADMAP.md) • [CHANGELOG](./CHANGELOG.md)

</div>
