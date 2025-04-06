import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { DensityProvider, DensityLevel } from '../../../../contexts/ui/DensityContext';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(
      <DensityProvider>
        <Button data-testid="test-button">Click Me</Button>
      </DensityProvider>
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('Click Me');
    expect(button.tagName).toBe('BUTTON');
  });
  
  it('applies variant classes correctly', () => {
    render(
      <DensityProvider>
        <Button variant="primary" data-testid="primary-button">Primary</Button>
        <Button variant="secondary" data-testid="secondary-button">Secondary</Button>
        <Button variant="danger" data-testid="danger-button">Danger</Button>
        <Button variant="success" data-testid="success-button">Success</Button>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('primary-button')).toHaveClass('btn-primary');
    expect(screen.getByTestId('secondary-button')).toHaveClass('btn-secondary');
    expect(screen.getByTestId('danger-button')).toHaveClass('btn-danger');
    expect(screen.getByTestId('success-button')).toHaveClass('btn-success');
  });
  
  it('applies size classes correctly', () => {
    render(
      <DensityProvider>
        <Button size="small" data-testid="small-button">Small</Button>
        <Button size="medium" data-testid="medium-button">Medium</Button>
        <Button size="large" data-testid="large-button">Large</Button>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('small-button')).toHaveClass('btn-small');
    expect(screen.getByTestId('medium-button')).toHaveClass('btn-medium');
    expect(screen.getByTestId('large-button')).toHaveClass('btn-large');
  });
  
  it('handles disabled state correctly', () => {
    render(
      <DensityProvider>
        <Button disabled data-testid="disabled-button">Disabled</Button>
      </DensityProvider>
    );
    
    const button = screen.getByTestId('disabled-button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-disabled');
  });
  
  it('handles loading state correctly', () => {
    render(
      <DensityProvider>
        <Button loading data-testid="loading-button">Loading</Button>
      </DensityProvider>
    );
    
    const button = screen.getByTestId('loading-button');
    expect(button).toHaveClass('btn-loading');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
  
  it('handles fullWidth prop correctly', () => {
    render(
      <DensityProvider>
        <Button fullWidth data-testid="full-width-button">Full Width</Button>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('full-width-button')).toHaveClass('btn-full-width');
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    
    render(
      <DensityProvider>
        <Button onClick={handleClick} data-testid="clickable-button">Click Me</Button>
      </DensityProvider>
    );
    
    fireEvent.click(screen.getByTestId('clickable-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    
    render(
      <DensityProvider>
        <Button onClick={handleClick} disabled data-testid="disabled-button">Disabled</Button>
      </DensityProvider>
    );
    
    fireEvent.click(screen.getByTestId('disabled-button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('applies density classes correctly', () => {
    render(
      <DensityProvider initialDensity={DensityLevel.COMPACT}>
        <Button data-testid="density-button">Button</Button>
      </DensityProvider>
    );
    
    const button = screen.getByTestId('density-button');
    expect(button).toHaveClass('density-button');
    expect(button).toHaveAttribute('data-density', DensityLevel.COMPACT);
  });
  
  it('renders as a different element when as prop is provided', () => {
    render(
      <DensityProvider>
        <Button as="a" href="#" data-testid="link-button">Link Button</Button>
      </DensityProvider>
    );
    
    const button = screen.getByTestId('link-button');
    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', '#');
  });
});
