import { render, screen } from '@testing-library/react';
import { Form } from '../Form';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('Form Component', () => {
  it('renders form with children', () => {
    renderWithDensity(
      <Form>
        <div data-testid="test-child">Test Child</div>
      </Form>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
  
  it('applies className correctly', () => {
    renderWithDensity(
      <Form className="test-class">
        <div>Test Content</div>
      </Form>
    );
    
    const form = screen.getByRole('form');
    expect(form).toHaveClass('test-class');
  });
  
  it('sets fullWidth style when fullWidth prop is true', () => {
    renderWithDensity(
      <Form fullWidth>
        <div>Test Content</div>
      </Form>
    );
    
    const form = screen.getByRole('form');
    expect(form).toHaveClass('w-full');
  });
  
  it('applies correct attributes', () => {
    renderWithDensity(
      <Form id="test-form" name="test-form" data-testid="form-element">
        <div>Test Content</div>
      </Form>
    );
    
    const form = screen.getByTestId('form-element');
    expect(form).toHaveAttribute('id', 'test-form');
    expect(form).toHaveAttribute('name', 'test-form');
  });
});
