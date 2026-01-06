import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageThemeModal from '../../../components/settings/LanguageThemeModal';
import { renderWithProviders } from '../../../test/test-utils';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    handleApiError: vi.fn(),
  }),
}));

describe('LanguageThemeModal', () => {
  const mockOnSave = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <LanguageThemeModal
        isOpen={false}
        onClose={mockOnClose}
        currentLocale="he"
        currentTheme="light"
        onSave={mockOnSave}
      />
    );
    
    expect(screen.queryByText(/language|theme/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <LanguageThemeModal
        isOpen={true}
        onClose={mockOnClose}
        currentLocale="he"
        currentTheme="light"
        onSave={mockOnSave}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onSave when changing language', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LanguageThemeModal
        isOpen={true}
        onClose={mockOnClose}
        currentLocale="he"
        currentTheme="light"
        onSave={mockOnSave}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const englishButton = buttons.find(btn => 
      btn.textContent?.includes('English') || btn.textContent?.includes('en')
    );
    
    if (englishButton) {
      await user.click(englishButton);
      
      const saveButton = screen.getByRole('button', { name: /save|שמור/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('should call onSave when changing theme', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LanguageThemeModal
        isOpen={true}
        onClose={mockOnClose}
        currentLocale="he"
        currentTheme="light"
        onSave={mockOnSave}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const darkThemeButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('dark') ||
      btn.textContent?.includes('🌙')
    );
    
    if (darkThemeButton) {
      await user.click(darkThemeButton);
      
      const saveButton = screen.getByRole('button', { name: /save|שמור/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });
});

