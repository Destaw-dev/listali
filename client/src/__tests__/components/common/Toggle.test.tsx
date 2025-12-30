import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../../../components/common/Toggle';

describe('Toggle Component', () => {
  it('should render toggle', () => {
    render(<Toggle isEnabled={false} />);
    const toggle = screen.getByRole('button');
    expect(toggle).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Toggle isEnabled={false} onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render enabled state', () => {
    const { container } = render(<Toggle isEnabled={true} />);
    const toggle = container.querySelector('button');
    expect(toggle).toBeInTheDocument();
    
    // Check for enabled styling
    const innerCircle = container.querySelector('.translate-x-3');
    expect(innerCircle).toBeInTheDocument();
  });

  it('should render disabled state', () => {
    const { container } = render(<Toggle isEnabled={false} />);
    const toggle = container.querySelector('button');
    expect(toggle).toBeInTheDocument();
    
    // Check for disabled styling
    const innerCircle = container.querySelector('.-translate-x-3');
    expect(innerCircle).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender, container } = render(<Toggle isEnabled={true} variant="primary" />);
    expect(container.querySelector('button')).toBeInTheDocument();

    rerender(<Toggle isEnabled={true} variant="secondary" />);
    expect(container.querySelector('button')).toBeInTheDocument();

    rerender(<Toggle isEnabled={true} variant="success" />);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Toggle isEnabled={false} className="custom-class" />);
    const toggle = container.querySelector('button');
    expect(toggle?.className).toContain('custom-class');
  });
});

