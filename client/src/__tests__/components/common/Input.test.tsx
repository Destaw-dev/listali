import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, TextArea } from '../../../components/common/Input';

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render input with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should display error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(<Input helperText="This is helpful text" />);
    expect(screen.getByText('This is helpful text')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Input variant="default" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input variant="outlined" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input variant="filled" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with different statuses', () => {
    const { rerender } = render(<Input status="success" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input status="warning" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input status="error" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render floating label', () => {
    render(<Input floatingLabel label="Floating Label" placeholder=" " />);
    expect(screen.getByText('Floating Label')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    const icon = <span data-testid="icon">🔍</span>;
    render(<Input icon={icon} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should handle focus and blur events', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    const user = userEvent.setup();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalled();
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });
});

describe('TextArea Component', () => {
  it('should render textarea', () => {
    render(<TextArea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<TextArea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<TextArea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'test content');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should display error message', () => {
    render(<TextArea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should render with custom rows', () => {
    render(<TextArea rows={5} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TextArea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });
});

