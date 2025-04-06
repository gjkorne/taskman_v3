import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { DensityProvider, DensityLevel } from '../../../../contexts/ui/DensityContext';

describe('Card Component', () => {
  it('renders correctly with default props', () => {
    render(
      <DensityProvider>
        <Card data-testid="test-card">Card Content</Card>
      </DensityProvider>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
    expect(card.textContent).toBe('Card Content');
    expect(card.className).toContain('card-elevation-1'); // Default elevation is 1
  });
  
  it('renders title when provided', () => {
    render(
      <DensityProvider>
        <Card title="Card Title" data-testid="test-card">Card Content</Card>
      </DensityProvider>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toContainHTML('Card Title');
    expect(card).toContainHTML('Card Content');
  });
  
  it('renders string title as h3', () => {
    render(
      <DensityProvider>
        <Card title="Card Title" data-testid="test-card">Card Content</Card>
      </DensityProvider>
    );
    
    const headingElement = screen.getByText('Card Title');
    expect(headingElement.tagName).toBe('H3');
  });
  
  it('renders ReactNode title as provided', () => {
    render(
      <DensityProvider>
        <Card 
          title={<span data-testid="custom-title">Custom Title</span>} 
          data-testid="test-card"
        >
          Card Content
        </Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    expect(screen.getByTestId('custom-title').textContent).toBe('Custom Title');
  });
  
  it('renders footer when provided', () => {
    render(
      <DensityProvider>
        <Card 
          footer={<div data-testid="card-footer">Footer Content</div>}
          data-testid="test-card"
        >
          Card Content
        </Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByTestId('card-footer').textContent).toBe('Footer Content');
  });
  
  it('applies different elevation levels correctly', () => {
    render(
      <DensityProvider>
        <Card elevation={0} data-testid="elevation-0">Elevation 0</Card>
        <Card elevation={1} data-testid="elevation-1">Elevation 1</Card>
        <Card elevation={2} data-testid="elevation-2">Elevation 2</Card>
        <Card elevation={3} data-testid="elevation-3">Elevation 3</Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('elevation-0')).toHaveClass('card-elevation-0');
    expect(screen.getByTestId('elevation-1')).toHaveClass('card-elevation-1');
    expect(screen.getByTestId('elevation-2')).toHaveClass('card-elevation-2');
    expect(screen.getByTestId('elevation-3')).toHaveClass('card-elevation-3');
  });
  
  it('applies bordered class when bordered prop is true', () => {
    render(
      <DensityProvider>
        <Card bordered data-testid="bordered-card">Bordered Card</Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('bordered-card')).toHaveClass('card-bordered');
  });
  
  it('applies hoverable class when hoverable prop is true', () => {
    render(
      <DensityProvider>
        <Card hoverable data-testid="hoverable-card">Hoverable Card</Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('hoverable-card')).toHaveClass('card-hoverable');
  });
  
  it('renders header actions when provided', () => {
    render(
      <DensityProvider>
        <Card 
          title="Card Title"
          headerActions={<button data-testid="action-button">Action</button>}
          data-testid="test-card"
        >
          Card Content
        </Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByTestId('action-button').textContent).toBe('Action');
  });
  
  it('applies custom className', () => {
    render(
      <DensityProvider>
        <Card className="custom-class" data-testid="test-card">Content</Card>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('test-card')).toHaveClass('custom-class');
  });
  
  it('applies density attributes', () => {
    // Mock localStorage to set initial density
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(DensityLevel.COMPACT);
    
    render(
      <DensityProvider>
        <Card data-testid="test-card">Content</Card>
      </DensityProvider>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toHaveAttribute('data-density', DensityLevel.COMPACT);
    
    getItemSpy.mockRestore();
  });
  
  it('renders as a different element when as prop is provided', () => {
    render(
      <DensityProvider>
        <Card as="section" data-testid="section-card">Section Card</Card>
      </DensityProvider>
    );
    
    const card = screen.getByTestId('section-card');
    expect(card.tagName).toBe('SECTION');
  });
});
