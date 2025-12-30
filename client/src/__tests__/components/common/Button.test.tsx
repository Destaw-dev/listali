import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/common/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be disabled when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const spinner = screen.getByRole('button').querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render icon on the left by default', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Button icon={icon}>Button with Icon</Button>);
    
    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');
    expect(iconElement).toBeInTheDocument();
    
    // Check icon is before text
    const buttonText = button.textContent;
    expect(buttonText?.indexOf('Icon')).toBeLessThan(buttonText?.indexOf('Button with Icon') || -1);
  });

  it('should render icon on the right when iconPosition is right', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Button icon={icon} iconPosition="right">Button with Icon</Button>);
    
    const iconElement = screen.getByTestId('icon');
    expect(iconElement).toBeInTheDocument();
  });

  it('should apply fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });

  it('should apply rounded-full class when rounded is true', () => {
    render(<Button rounded>Rounded</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('rounded-full');
  });

  it('should render checkbox variant correctly', () => {
    render(<Button variant="checkbox" checked />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('size-6');
  });

  it('should show check icon when checkbox variant is checked', () => {
    render(<Button variant="checkbox" checked />);
    const button = screen.getByRole('button');
    const checkIcon = button.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should render different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Button size="xs">XS</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="sm">SM</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="md">MD</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">LG</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="xl">XL</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have type="button" by default', () => {
    render(<Button>Default Type</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should accept custom type prop', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

