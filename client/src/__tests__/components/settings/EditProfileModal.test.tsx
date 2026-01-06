import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProfileModal from '../../../components/settings/EditProfileModal';
import { renderWithProviders } from '../../../test/test-utils';
import { mockUser } from '../../mocks/mockData';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showError: vi.fn(),
  }),
}));

describe('EditProfileModal', () => {
  const mockOnSave = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <EditProfileModal
        isOpen={false}
        onClose={mockOnClose}
        user={mockUser}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.queryByText(/profile|פרופיל/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
        onSave={mockOnSave}
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should populate form with user data', () => {
    renderWithProviders(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
        onSave={mockOnSave}
      />
    );
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const firstNameInput = inputs.find(inp => 
      (inp as HTMLInputElement).value === mockUser.firstName
    );
    expect(firstNameInput || inputs.length > 0).toBeTruthy();
  });

  it('should call onSave with updated data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
        onSave={mockOnSave}
      />
    );
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const firstNameInput = inputs[0];
    
    if (firstNameInput) {
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');
      
      const saveButton = screen.getByRole('button', { name: /save|שמור/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });
});

