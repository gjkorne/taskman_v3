import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';
import { DensityProvider, DensityLevel } from '../../../../contexts/ui/DensityContext';

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(
      <DensityProvider>
        <Input data-testid="test-input" />
      </DensityProvider>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('text'); // Default type is text
  });
  
  it('renders with different input types', () => {
    render(
      <DensityProvider>
        <Input type="email" data-testid="email-input" />
        <Input type="password" data-testid="password-input" />
        <Input type="number" data-testid="number-input" />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('email-input').getAttribute('type')).toBe('email');
    expect(screen.getByTestId('password-input').getAttribute('type')).toBe('password');
    expect(screen.getByTestId('number-input').getAttribute('type')).toBe('number');
  });
  
  it('applies label when provided', () => {
    render(
      <DensityProvider>
        <Input label="Email Address" data-testid="labeled-input" />
      </DensityProvider>
    );
    
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Email Address').tagName).toBe('LABEL');
  });
  
  it('handles value and onChange correctly', () => {
    const handleChange = jest.fn();
    
    render(
      <DensityProvider>
        <Input
          value="test"
          onChange={handleChange}
          data-testid="controlled-input"
        />
      </DensityProvider>
    );
    
    const input = screen.getByTestId('controlled-input');
    expect(input).toHaveValue('test');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });
  
  it('applies error styling when error prop is true', () => {
    render(
      <DensityProvider>
        <Input error="true" data-testid="error-input" />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('error-input')).toHaveClass('input-error');
  });
  
  it('displays error message when error is provided', () => {
    render(
      <DensityProvider>
        <Input 
          error="This field is required" 
          data-testid="error-input" 
        />
      </DensityProvider>
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('input-error-text');
  });
  
  it('displays helper text when helperText is provided', () => {
    render(
      <DensityProvider>
        <Input 
          helperText="Enter your email address" 
          data-testid="helper-input" 
        />
      </DensityProvider>
    );
    
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address')).toHaveClass('input-helper-text');
  });
  
  it('applies fullWidth styling when fullWidth is true', () => {
    render(
      <DensityProvider>
        <Input fullWidth data-testid="full-width-input" />
      </DensityProvider>
    );
    
    const inputContainer = screen.getByTestId('full-width-input').closest('.input-container');
    expect(inputContainer).toHaveClass('input-full-width');
  });
  
  it('applies disabled state correctly', () => {
    render(
      <DensityProvider>
        <Input disabled data-testid="disabled-input" />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('disabled-input')).toBeDisabled();
  });
  
  it('renders prefix and suffix when provided', () => {
    render(
      <DensityProvider>
        <Input 
          prefix={<span data-testid="prefix-content">$</span>}
          suffix={<span data-testid="suffix-content">.00</span>}
          data-testid="decorated-input" 
        />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('prefix-content')).toBeInTheDocument();
    expect(screen.getByTestId('prefix-content').textContent).toBe('$');
    
    expect(screen.getByTestId('suffix-content')).toBeInTheDocument();
    expect(screen.getByTestId('suffix-content').textContent).toBe('.00');
    
    expect(screen.getByTestId('decorated-input')).toHaveClass('input-has-prefix');
    expect(screen.getByTestId('decorated-input')).toHaveClass('input-has-suffix');
  });
  
  it('applies custom className', () => {
    render(
      <DensityProvider>
        <Input className="custom-class" data-testid="custom-input" />
      </DensityProvider>
    );
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveClass('custom-class');
  });
  
  it('applies density classes and attributes', () => {
    // Mock localStorage to set initial density
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(DensityLevel.COMPACT);
    
    render(
      <DensityProvider>
        <Input data-testid="density-input" />
      </DensityProvider>
    );
    
    const input = screen.getByTestId('density-input');
    expect(input).toHaveClass('density-input');
    expect(input).toHaveAttribute('data-density', DensityLevel.COMPACT);
    
    getItemSpy.mockRestore();
  });
});
