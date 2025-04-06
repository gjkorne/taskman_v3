import { render, screen, fireEvent } from '@testing-library/react';
import { Menu } from '../Menu';
import { MenuItem } from '../MenuItem';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('Menu Component', () => {
  it('renders trigger but not menu content when closed', () => {
    renderWithDensity(
      <Menu trigger={<button>Open Menu</button>}>
        <MenuItem>Option 1</MenuItem>
        <MenuItem>Option 2</MenuItem>
      </Menu>
    );
    
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });
  
  it('renders menu content when trigger is clicked', () => {
    renderWithDensity(
      <Menu trigger={<button>Open Menu</button>}>
        <MenuItem>Option 1</MenuItem>
        <MenuItem>Option 2</MenuItem>
      </Menu>
    );
    
    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
  
  it('closes menu when clicking outside', () => {
    renderWithDensity(
      <div>
        <div data-testid="outside">Outside</div>
        <Menu trigger={<button>Open Menu</button>}>
          <MenuItem>Option 1</MenuItem>
        </Menu>
      </div>
    );
    
    // Open the menu
    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
  
  it('closes menu when escape key is pressed', () => {
    renderWithDensity(
      <Menu trigger={<button>Open Menu</button>}>
        <MenuItem>Option 1</MenuItem>
      </Menu>
    );
    
    // Open the menu
    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
  
  it('applies alignment class correctly', () => {
    renderWithDensity(
      <Menu trigger={<button>Open Menu</button>} align="right">
        <MenuItem>Option 1</MenuItem>
      </Menu>
    );
    
    // Open the menu
    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);
    
    const menuElement = screen.getByRole('menu');
    expect(menuElement).toHaveClass('right-0');
    expect(menuElement).not.toHaveClass('left-0');
  });
});
