import { render, screen } from '@testing-library/react';
import { FormGroup } from '../FormGroup';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('FormGroup Component', () => {
  it('renders with label and children', () => {
    renderWithDensity(
      <FormGroup label="Test Label" htmlFor="test-input">
        <input id="test-input" data-testid="test-input" />
      </FormGroup>
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });
  
  it('shows required indicator when required is true', () => {
    renderWithDensity(
      <FormGroup label="Required Field" htmlFor="test-input" required>
        <input id="test-input" />
      </FormGroup>
    );
    
    const label = screen.getByText('Required Field');
    expect(label.parentElement).toContainHTML('*');
  });
  
  it('displays error message when error is provided', () => {
    const errorMessage = 'This field is required';
    renderWithDensity(
      <FormGroup label="Test Field" htmlFor="test-input" error={errorMessage}>
        <input id="test-input" />
      </FormGroup>
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('text-red-500');
  });
  
  it('displays help text when provided and no error exists', () => {
    const helpText = 'Enter your username';
    renderWithDensity(
      <FormGroup label="Username" htmlFor="username" helpText={helpText}>
        <input id="username" />
      </FormGroup>
    );
    
    expect(screen.getByText(helpText)).toBeInTheDocument();
    expect(screen.getByText(helpText)).toHaveClass('text-gray-500');
  });
  
  it('prioritizes error message over help text when both are provided', () => {
    const helpText = 'Enter your username';
    const errorMessage = 'Username is required';
    
    renderWithDensity(
      <FormGroup 
        label="Username" 
        htmlFor="username" 
        helpText={helpText}
        error={errorMessage}
      >
        <input id="username" />
      </FormGroup>
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(helpText)).not.toBeInTheDocument();
  });
  
  it('applies custom className when provided', () => {
    renderWithDensity(
      <FormGroup
        label="Custom Class"
        htmlFor="test-input"
        className="test-custom-class"
        data-testid="form-group"
      >
        <input id="test-input" />
      </FormGroup>
    );
    
    const formGroup = screen.getByTestId('form-group');
    expect(formGroup).toHaveClass('test-custom-class');
  });
});
