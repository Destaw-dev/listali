# Testing Guide

This project uses **Vitest** and **React Testing Library** for testing.

## Setup

The testing setup includes:
- **Vitest** - Fast test runner
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Additional matchers
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for tests

## Running Tests

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located next to the files they test:
- Component tests: `src/components/**/__tests__/*.test.tsx`
- Utility tests: `src/lib/__tests__/*.test.ts`
- Hook tests: `src/hooks/__tests__/*.test.ts`

## Writing Tests

### Testing Utilities

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../utils';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Testing Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with React Query

Use the `renderWithProviders` helper from `test-utils.tsx`:

```typescript
import { renderWithProviders } from '../test/test-utils';
import { MyComponent } from '../MyComponent';

it('should work with React Query', () => {
  const { queryClient } = renderWithProviders(<MyComponent />);
  // Your test here
});
```

## Mocks

Common mocks are set up in `src/test/setup.ts`:
- `next/navigation` - Router hooks
- `next-intl` - Internationalization
- `framer-motion` - Animation library
- `react-hot-toast` - Toast notifications
- `socket.io-client` - WebSocket client

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (`getByRole`, `getByLabelText`) over `getByTestId`
3. **Keep tests simple and focused** - one assertion per test when possible
4. **Use descriptive test names** that explain what is being tested
5. **Mock external dependencies** appropriately
6. **Test edge cases** and error states

## Coverage

To generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

