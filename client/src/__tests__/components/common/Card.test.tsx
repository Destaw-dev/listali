import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/common/Card';

describe('Card Component', () => {
  it('should render card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Card variant="default">Default</Card>);
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toBeInTheDocument();

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toBeInTheDocument();

    rerender(<Card variant="glass">Glass</Card>);
    expect(screen.getByText('Glass')).toBeInTheDocument();
  });

  it('should render with different padding sizes', () => {
    const { rerender } = render(<Card padding="none">No Padding</Card>);
    expect(screen.getByText('No Padding')).toBeInTheDocument();

    rerender(<Card padding="sm">Small</Card>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Card padding="md">Medium</Card>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<Card padding="lg">Large</Card>);
    expect(screen.getByText('Large')).toBeInTheDocument();

    rerender(<Card padding="xl">Extra Large</Card>);
    expect(screen.getByText('Extra Large')).toBeInTheDocument();
  });

  it('should render with different rounded corners', () => {
    const { rerender } = render(<Card rounded="sm">Small</Card>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Card rounded="md">Medium</Card>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<Card rounded="lg">Large</Card>);
    expect(screen.getByText('Large')).toBeInTheDocument();

    rerender(<Card rounded="xl">Extra Large</Card>);
    expect(screen.getByText('Extra Large')).toBeInTheDocument();

    rerender(<Card rounded="full">Full</Card>);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('should render with different shadow sizes', () => {
    const { rerender } = render(<Card shadow="none">No Shadow</Card>);
    expect(screen.getByText('No Shadow')).toBeInTheDocument();

    rerender(<Card shadow="sm">Small</Card>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Card shadow="md">Medium</Card>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<Card shadow="lg">Large</Card>);
    expect(screen.getByText('Large')).toBeInTheDocument();

    rerender(<Card shadow="xl">Extra Large</Card>);
    expect(screen.getByText('Extra Large')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Card onClick={handleClick}>Clickable Card</Card>);
    await user.click(screen.getByText('Clickable Card'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply hover effect when hover prop is true', () => {
    render(<Card hover>Hover Card</Card>);
    const card = screen.getByText('Hover Card');
    expect(card.className).toContain('hover:scale-[1.02]');
  });

  it('should apply custom className', () => {
    render(<Card className="custom-class">Custom</Card>);
    const card = screen.getByText('Custom');
    expect(card.className).toContain('custom-class');
  });
});

describe('CardHeader Component', () => {
  it('should render card header', () => {
    render(
      <Card>
        <CardHeader>Header Content</CardHeader>
      </Card>
    );
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should render with different padding sizes', () => {
    const { rerender } = render(
      <Card>
        <CardHeader padding="none">No Padding</CardHeader>
      </Card>
    );
    expect(screen.getByText('No Padding')).toBeInTheDocument();

    rerender(
      <Card>
        <CardHeader padding="sm">Small</CardHeader>
      </Card>
    );
    expect(screen.getByText('Small')).toBeInTheDocument();
  });
});

describe('CardBody Component', () => {
  it('should render card body', () => {
    render(
      <Card>
        <CardBody>Body Content</CardBody>
      </Card>
    );
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('should render with different padding sizes', () => {
    const { rerender } = render(
      <Card>
        <CardBody padding="none">No Padding</CardBody>
      </Card>
    );
    expect(screen.getByText('No Padding')).toBeInTheDocument();

    rerender(
      <Card>
        <CardBody padding="xl">Extra Large</CardBody>
      </Card>
    );
    expect(screen.getByText('Extra Large')).toBeInTheDocument();
  });
});

describe('CardFooter Component', () => {
  it('should render card footer', () => {
    render(
      <Card>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should render with different padding sizes', () => {
    const { rerender } = render(
      <Card>
        <CardFooter padding="none">No Padding</CardFooter>
      </Card>
    );
    expect(screen.getByText('No Padding')).toBeInTheDocument();

    rerender(
      <Card>
        <CardFooter padding="lg">Large</CardFooter>
      </Card>
    );
    expect(screen.getByText('Large')).toBeInTheDocument();
  });
});

describe('Card Composition', () => {
  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

