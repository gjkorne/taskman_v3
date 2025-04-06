import { render, screen, fireEvent } from '@testing-library/react';
import { MenuItem } from '../MenuItem';
import { MenuContext } from '../Menu';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock the MenuContext
const mockCloseMenu = jest.fn();
const mockHandleItemClick = jest.fn();

const MenuContextWrapper: React.FC<{
  children: React.ReactNode;
  densityLevel?: string;
}> = ({ children, densityLevel = 'normal' }) => (
  <MenuContext.Provider
    value={{
      closeMenu: mockCloseMenu,
      handleItemClick: mockHandleItemClick,
      densityLevel
    }}
  >
    {children}
  </MenuContext.Provider>
);

// Reusable render function with context
const renderMenuItem = (ui: React.ReactElement, densityLevel: string = 'normal') => {
  return render(
    <DensityProvider>
      <MenuContextWrapper densityLevel={densityLevel}>
        {ui}
      </MenuContextWrapper>
    </DensityProvider>
  );
};

describe('MenuItem Component', () => {
  beforeEach(() => {
    mockCloseMenu.mockClear();
    mockHandleItemClick.mockClear();
  });

  it('renders menu item text correctly', () => {
    renderMenuItem(<MenuItem>Item Text</MenuItem>);
    expect(screen.getByText('Item Text')).toBeInTheDocument();
  });
  
  it('calls onClick and handleItemClick when clicked', () => {
    const mockOnClick = jest.fn();
    renderMenuItem(<MenuItem onClick={mockOnClick}>Click Me</MenuItem>);
    
    fireEvent.click(screen.getByText('Click Me'));
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockHandleItemClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const mockOnClick = jest.fn();
    renderMenuItem(<MenuItem onClick={mockOnClick} disabled>Disabled Item</MenuItem>);
    
    fireEvent.click(screen.getByText('Disabled Item'));
    
    expect(mockOnClick).not.toHaveBeenCalled();
    expect(mockHandleItemClick).not.toHaveBeenCalled();
  });
  
  it('applies danger styles when danger prop is true', () => {
    renderMenuItem(<MenuItem danger>Danger Item</MenuItem>);
    
    const menuItem = screen.getByText('Danger Item');
    expect(menuItem).toHaveClass('text-red-600');
  });
  
  it('applies selected styles when selected prop is true', () => {
    renderMenuItem(<MenuItem selected>Selected Item</MenuItem>);
    
    const menuItem = screen.getByText('Selected Item');
    expect(menuItem).toHaveClass('bg-gray-100');
  });
  
  it('renders icon when provided', () => {
    const iconTestId = 'test-icon';
    renderMenuItem(
      <MenuItem icon={<span data-testid={iconTestId}>🔍</span>}>
        With Icon
      </MenuItem>
    );
    
    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });
  
  it('applies compact density styles correctly', () => {
    renderMenuItem(<MenuItem>Compact Item</MenuItem>, 'compact');
    
    const menuItem = screen.getByText('Compact Item');
    expect(menuItem).toHaveClass('px-2');
    expect(menuItem).toHaveClass('py-1');
    expect(menuItem).toHaveClass('text-xs');
  });
  
  it('applies comfortable density styles correctly', () => {
    renderMenuItem(<MenuItem>Comfortable Item</MenuItem>, 'comfortable');
    
    const menuItem = screen.getByText('Comfortable Item');
    expect(menuItem).toHaveClass('px-4');
    expect(menuItem).toHaveClass('py-3');
    expect(menuItem).toHaveClass('text-base');
  });
});
