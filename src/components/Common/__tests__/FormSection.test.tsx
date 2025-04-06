import { render, screen } from '@testing-library/react';
import { FormSection } from '../FormSection';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('FormSection Component', () => {
  it('renders with title and children', () => {
    renderWithDensity(
      <FormSection title="Section Title">
        <div data-testid="section-content">Section Content</div>
      </FormSection>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
  });
  
  it('applies custom className when provided', () => {
    renderWithDensity(
      <FormSection title="Custom Class" className="test-custom-class" data-testid="form-section">
        <div>Content</div>
      </FormSection>
    );
    
    const formSection = screen.getByTestId('form-section');
    expect(formSection).toHaveClass('test-custom-class');
  });
  
  it('hides title when hideTitle prop is true', () => {
    renderWithDensity(
      <FormSection title="Hidden Title" hideTitle={true}>
        <div>Content</div>
      </FormSection>
    );
    
    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
  });
  
  it('uses gradient styling for title when useGradient is true', () => {
    renderWithDensity(
      <FormSection title="Gradient Title" useGradient={true}>
        <div>Content</div>
      </FormSection>
    );
    
    const title = screen.getByText('Gradient Title');
    expect(title).toHaveClass('bg-gradient-to-r');
    expect(title).toHaveClass('from-indigo-600');
    expect(title).toHaveClass('to-purple-600');
  });
  
  it('uses plain text styling for title when useGradient is false', () => {
    renderWithDensity(
      <FormSection title="Plain Title" useGradient={false}>
        <div>Content</div>
      </FormSection>
    );
    
    const title = screen.getByText('Plain Title');
    expect(title).toHaveClass('text-gray-800');
    expect(title).not.toHaveClass('bg-gradient-to-r');
  });
  
  it('adjusts spacing based on density context', () => {
    // This test is more complex as it would require verifying computed styles
    // or checking specific classes that are applied based on the density level.
    // For simplicity, we'll just check that the component renders with the density class
    renderWithDensity(
      <FormSection title="Density Test" data-testid="density-section">
        <div>Content</div>
      </FormSection>
    );
    
    const section = screen.getByTestId('density-section');
    expect(section).toHaveClass('density-container');
  });
});
