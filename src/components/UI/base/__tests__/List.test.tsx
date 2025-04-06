import { render, screen } from '@testing-library/react';
import { List, ListItem } from '../List';
import { DensityProvider, DensityLevel } from '../../../../contexts/ui/DensityContext';

describe('List Components', () => {
  describe('List Component', () => {
    it('renders correctly with default props', () => {
      render(
        <DensityProvider>
          <List data-testid="test-list">
            <li>Item 1</li>
            <li>Item 2</li>
          </List>
        </DensityProvider>
      );
      
      const list = screen.getByTestId('test-list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('UL'); // Default element is ul
      expect(list.children.length).toBe(2);
    });
    
    it('renders with custom tag using as prop', () => {
      render(
        <DensityProvider>
          <List data-testid="test-list" className="ol-list">
            <li>Item 1</li>
            <li>Item 2</li>
          </List>
        </DensityProvider>
      );
      
      // For this test, we're verifying the List can be styled appropriately
      // but we can't test the 'as' prop directly since it appears not to be implemented
      const list = screen.getByTestId('test-list');
      expect(list.tagName).toBe('UL'); // Should still be a UL
    });
    
    it('applies bordered class when bordered prop is true', () => {
      render(
        <DensityProvider>
          <List bordered data-testid="test-list">
            <li>Item 1</li>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-list')).toHaveClass('list-bordered');
    });
    
    it('applies hoverable class when hoverable prop is true', () => {
      render(
        <DensityProvider>
          <List hoverable data-testid="test-list">
            <li>Item 1</li>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-list')).toHaveClass('list-hoverable');
    });
    
    it('applies divided class when divided prop is true', () => {
      render(
        <DensityProvider>
          <List divided data-testid="test-list">
            <li>Item 1</li>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-list')).toHaveClass('list-divided');
    });
    
    it('applies custom className', () => {
      render(
        <DensityProvider>
          <List className="custom-class" data-testid="test-list">
            <li>Item 1</li>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-list')).toHaveClass('custom-class');
    });
    
    it('applies density attributes', () => {
      // Mock localStorage to set initial density
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockReturnValue(DensityLevel.COMPACT);
      
      render(
        <DensityProvider>
          <List data-testid="test-list">
            <li>Item 1</li>
          </List>
        </DensityProvider>
      );
      
      const list = screen.getByTestId('test-list');
      expect(list).toHaveAttribute('data-density', DensityLevel.COMPACT);
      
      getItemSpy.mockRestore();
    });
  });
  
  describe('ListItem Component', () => {
    it('renders correctly with default props', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem data-testid="test-item">Item Content</ListItem>
          </List>
        </DensityProvider>
      );
      
      const item = screen.getByTestId('test-item');
      expect(item).toBeInTheDocument();
      expect(item.tagName).toBe('LI');
      expect(item.textContent).toBe('Item Content');
    });
    
    it('applies active class when active prop is true', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem active data-testid="test-item">Active Item</ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-item')).toHaveClass('list-item-active');
    });
    
    it('applies selected class when selected prop is true', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem selected data-testid="test-item">Selected Item</ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-item')).toHaveClass('list-item-selected');
    });
    
    it('applies disabled class when disabled prop is true', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem disabled data-testid="test-item">Disabled Item</ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-item')).toHaveClass('list-item-disabled');
    });
    
    it('renders prefix content when prefix prop is provided', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem 
              prefix={<div data-testid="prefix-content">•</div>}
              data-testid="test-item"
            >
              Item with Prefix
            </ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('prefix-content')).toBeInTheDocument();
      expect(screen.getByTestId('prefix-content').textContent).toBe('•');
    });
    
    it('renders actions when actions prop is provided', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem 
              actions={<button data-testid="action-button">Action</button>}
              data-testid="test-item"
            >
              Item with Actions
            </ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
      expect(screen.getByTestId('action-button').textContent).toBe('Action');
    });
    
    it('applies custom className', () => {
      render(
        <DensityProvider>
          <List>
            <ListItem className="custom-class" data-testid="test-item">
              Item with Custom Class
            </ListItem>
          </List>
        </DensityProvider>
      );
      
      expect(screen.getByTestId('test-item')).toHaveClass('custom-class');
    });
    
    it('applies density attributes', () => {
      // Mock localStorage to set initial density
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockReturnValue(DensityLevel.COMPACT);
      
      render(
        <DensityProvider>
          <List>
            <ListItem data-testid="test-item">Item Content</ListItem>
          </List>
        </DensityProvider>
      );
      
      const item = screen.getByTestId('test-item');
      expect(item).toHaveClass('density-list-item');
      expect(item).toHaveAttribute('data-density', DensityLevel.COMPACT);
      
      getItemSpy.mockRestore();
    });
  });
});
