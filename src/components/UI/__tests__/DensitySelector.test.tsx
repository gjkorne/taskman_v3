import { render, screen, fireEvent } from '@testing-library/react';
import { DensitySelector } from '../DensitySelector';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

describe('DensitySelector Component', () => {
  it('renders with all density options', () => {
    render(
      <DensityProvider>
        <DensitySelector showLabels={true} />
      </DensityProvider>
    );
    
    // Check for all three density options
    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Comfortable')).toBeInTheDocument();
    
    // Check for the title
    expect(screen.getByText('UI Density')).toBeInTheDocument();
  });
  
  it('renders with custom title', () => {
    render(
      <DensityProvider>
        <DensitySelector title="Custom Title" showLabels={true} />
      </DensityProvider>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
  
  it('renders without labels when showLabels is false', () => {
    render(
      <DensityProvider>
        <DensitySelector showLabels={false} />
      </DensityProvider>
    );
    
    // Labels should not be visible
    expect(screen.queryByText('Compact')).not.toBeInTheDocument();
    expect(screen.queryByText('Normal')).not.toBeInTheDocument();
    expect(screen.queryByText('Comfortable')).not.toBeInTheDocument();
    
    // Description should not be visible
    expect(screen.queryByText(/view:/)).not.toBeInTheDocument();
  });
  
  it('highlights the current density setting', () => {
    render(
      <DensityProvider>
        <DensitySelector showLabels={true} />
      </DensityProvider>
    );
    
    // By default, Normal should be selected (primary variant)
    const normalButton = screen.getByText('Normal').closest('button');
    const compactButton = screen.getByText('Compact').closest('button');
    const comfortableButton = screen.getByText('Comfortable').closest('button');
    
    // Check button variants (implementation-dependent, adjust as needed)
    expect(normalButton).toHaveClass('primary');
    expect(compactButton).not.toHaveClass('primary');
    expect(comfortableButton).not.toHaveClass('primary');
  });
  
  it('changes density when an option is clicked', () => {
    render(
      <DensityProvider>
        <DensitySelector showLabels={true} />
      </DensityProvider>
    );
    
    // Find buttons
    const compactButton = screen.getByText('Compact').closest('button')!;
    const comfortableButton = screen.getByText('Comfortable').closest('button')!;
    
    // Click on compact density
    fireEvent.click(compactButton);
    
    // Description text should update
    expect(screen.getByText(/Compact view: Maximizes information density./)).toBeInTheDocument();
    
    // Click on comfortable density
    fireEvent.click(comfortableButton);
    
    // Description text should update
    expect(screen.getByText(/Comfortable view: More space between elements./)).toBeInTheDocument();
  });
  
  it('applies custom className', () => {
    render(
      <DensityProvider>
        <DensitySelector className="custom-class" />
      </DensityProvider>
    );
    
    const card = screen.getByText('UI Density').closest('.density-selector');
    expect(card).toHaveClass('custom-class');
  });
});
