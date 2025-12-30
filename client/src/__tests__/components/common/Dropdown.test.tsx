import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from '../../../components/common/Dropdown';

describe('Dropdown Component', () => {
  const mockOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3', disabled: true },
    { value: 'divider', label: '', divider: true },
    { value: '4', label: 'Option 4' },
  ];

  it('should render dropdown with placeholder', () => {
    render(<Dropdown options={mockOptions} placeholder="Select option" />);
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('should render selected value', () => {
    render(<Dropdown options={mockOptions} value="1" />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('should open menu on click', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('should call onSelect when option is clicked', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<Dropdown options={mockOptions} onSelect={handleSelect} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const option = screen.getByText('Option 1');
    await user.click(option);
    
    expect(handleSelect).toHaveBeenCalledWith('1', expect.objectContaining({ value: '1', label: 'Option 1' }));
  });

  it('should close menu after selecting option', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const option = screen.getByText('Option 1');
    await user.click(option);
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should not select disabled options', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<Dropdown options={mockOptions} onSelect={handleSelect} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    // Find disabled option button
    const disabledOptionButton = screen.getByText('Option 3').closest('button');
    expect(disabledOptionButton).toBeDisabled();
    
    if (disabledOptionButton) {
      await user.click(disabledOptionButton);
      expect(handleSelect).not.toHaveBeenCalled();
    }
  });

  it('should handle keyboard navigation', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} onSelect={handleSelect} closeOnSelect={false} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    // Should select second option
    await waitFor(() => {
      expect(handleSelect).toHaveBeenCalled();
    });
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Dropdown options={mockOptions} disabled />);
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
  });

  it('should render with label', () => {
    render(<Dropdown options={mockOptions} label="Choose option" />);
    expect(screen.getByText('Choose option')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Dropdown options={mockOptions} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(<Dropdown options={mockOptions} placeholder="Choose" helperText="Select an option" />);
    const helperTexts = screen.getAllByText('Select an option');
    expect(helperTexts.length).toBeGreaterThan(0);
  });

  it('should render with custom trigger', () => {
    const customTrigger = <button>Custom Trigger</button>;
    render(<Dropdown options={mockOptions} trigger={customTrigger} />);
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('should show selected indicator', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} value="1" />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      const optionButtons = screen.getAllByRole('option');
      const selectedOption = optionButtons.find(btn => btn.getAttribute('aria-selected') === 'true');
      expect(selectedOption).toBeTruthy();
    });
  });

  it('should handle controlled isOpen state', async () => {
    const { rerender } = render(<Dropdown options={mockOptions} isOpen={false} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    
    rerender(<Dropdown options={mockOptions} isOpen={true} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should call onOpenChange when menu opens/closes', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Dropdown options={mockOptions} onOpenChange={handleOpenChange} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });
});

