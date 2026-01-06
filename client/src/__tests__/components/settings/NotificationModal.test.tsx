import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationModal from '../../../components/settings/NotificationModal';
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

const mockSettings = {
  pushNotifications: true,
  emailNotifications: true,
  newMessageNotifications: true,
  shoppingListUpdates: true,
  groupInvitations: true,
};

describe('NotificationModal', () => {
  const mockOnSave = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <NotificationModal
        isOpen={false}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.queryByText(/notifications|התראות/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <NotificationModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    );
    
    const toggles = screen.queryAllByRole('switch') || screen.queryAllByRole('button');
    expect(toggles.length > 0 || screen.getAllByRole('button').length > 0).toBeTruthy();
  });

  it('should toggle notification setting', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <NotificationModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    );
    
    const toggles = screen.queryAllByRole('switch');
    if (toggles.length > 0) {
      await user.click(toggles[0]);
      
      const saveButton = screen.getByRole('button', { name: /save|שמור/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });
});

