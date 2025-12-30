import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, NotificationBadge, StatusBadge } from '../../../components/common/Badge';

describe('Badge Component', () => {
  it('should render badge with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Badge size="xs">XS</Badge>);
    expect(screen.getByText('XS')).toBeInTheDocument();

    rerender(<Badge size="sm">SM</Badge>);
    expect(screen.getByText('SM')).toBeInTheDocument();

    rerender(<Badge size="md">MD</Badge>);
    expect(screen.getByText('MD')).toBeInTheDocument();

    rerender(<Badge size="lg">LG</Badge>);
    expect(screen.getByText('LG')).toBeInTheDocument();
  });

  it('should render with rounded corners when rounded is true', () => {
    render(<Badge rounded>Rounded</Badge>);
    const badge = screen.getByText('Rounded');
    expect(badge.className).toContain('rounded-full');
  });

  it('should render with dot when dot prop is true', () => {
    render(<Badge dot>With Dot</Badge>);
    const badge = screen.getByText('With Dot');
    const dot = badge.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Badge onClick={handleClick}>Clickable</Badge>);
    await user.click(screen.getByText('Clickable'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Badge onClick={handleClick}>Clickable</Badge>);
    const badge = screen.getByText('Clickable');
    
    badge.focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('custom-class');
  });
});

describe('NotificationBadge Component', () => {
  it('should render notification badge with count', () => {
    render(
      <NotificationBadge count={5}>
        <button>Notifications</button>
      </NotificationBadge>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not render when count is 0 and showZero is false', () => {
    render(
      <NotificationBadge count={0}>
        <button>Notifications</button>
      </NotificationBadge>
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should render when count is 0 and showZero is true', () => {
    render(
      <NotificationBadge count={0} showZero>
        <button>Notifications</button>
      </NotificationBadge>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show maxCount+ when count exceeds maxCount', () => {
    render(
      <NotificationBadge count={150} maxCount={99}>
        <button>Notifications</button>
      </NotificationBadge>
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(
      <NotificationBadge count={5} variant="primary">
        <button>Test</button>
      </NotificationBadge>
    );
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(
      <NotificationBadge count={5} variant="error">
        <button>Test</button>
      </NotificationBadge>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('StatusBadge Component', () => {
  it('should render status badge', () => {
    const { container } = render(<StatusBadge status="online" />);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
  });

  it('should render with text when showText is true', () => {
    render(<StatusBadge status="online" showText />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render different statuses', () => {
    const { rerender, container } = render(<StatusBadge status="online" />);
    expect(container.querySelector('span')).toBeInTheDocument();

    rerender(<StatusBadge status="offline" />);
    expect(container.querySelector('span')).toBeInTheDocument();

    rerender(<StatusBadge status="away" />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});

