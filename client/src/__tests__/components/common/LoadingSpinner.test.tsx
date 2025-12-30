import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render message when not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />);
    let spinner = container.querySelector('.w-4.h-4');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    spinner = container.querySelector('.w-6.h-6');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    spinner = container.querySelector('.w-8.h-8');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<LoadingSpinner message="Test" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });
});

