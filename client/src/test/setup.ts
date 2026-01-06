import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import React from 'react';
import { server } from '../__tests__/mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: React.PropsWithChildren) => children,
  useNotification: () => ({
    showToast: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    handleApiError: vi.fn(),
    handleValidationError: vi.fn(),
  }),
  NotificationType: {
    ERROR: 'error',
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTH: 'auth',
    SERVER: 'server',
    CLIENT: 'client',
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
  },
}));

Element.prototype.scrollIntoView = vi.fn();

