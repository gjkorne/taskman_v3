import React from 'react';
import { render, screen } from '@testing-library/react';
import { Box } from '../Box';
import { DensityProvider, DensityLevel } from '../../../../contexts/ui/DensityContext';

describe('Box Component', () => {
  it('renders correctly with default props', () => {
    render(
      <DensityProvider>
        <Box data-testid="test-box">Test Content</Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toBeInTheDocument();
    expect(box.textContent).toBe('Test Content');
    expect(box.tagName).toBe('DIV'); // Default element is div
  });
  
  it('renders as different HTML elements using "as" prop', () => {
    render(
      <DensityProvider>
        <Box as="section" data-testid="section-box">Section Content</Box>
        <Box as="article" data-testid="article-box">Article Content</Box>
        <Box as="main" data-testid="main-box">Main Content</Box>
      </DensityProvider>
    );
    
    expect(screen.getByTestId('section-box').tagName).toBe('SECTION');
    expect(screen.getByTestId('article-box').tagName).toBe('ARTICLE');
    expect(screen.getByTestId('main-box').tagName).toBe('MAIN');
  });
  
  it('applies custom className', () => {
    render(
      <DensityProvider>
        <Box className="custom-class" data-testid="test-box">Content</Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toHaveClass('custom-class');
  });
  
  it('applies density class when densityClass is provided', () => {
    render(
      <DensityProvider>
        <Box densityClass="container" data-testid="test-box">Content</Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toHaveClass('density-container');
  });
  
  it('merges custom style with provided style prop', () => {
    const testStyle = { color: 'red', margin: '10px' };
    
    render(
      <DensityProvider>
        <Box style={testStyle} data-testid="test-box">Content</Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toHaveStyle('color: red');
    expect(box).toHaveStyle('margin: 10px');
  });
  
  it('forwards additional props to the underlying element', () => {
    render(
      <DensityProvider>
        <Box 
          data-testid="test-box"
          aria-label="Test Box"
          tabIndex={0}
        >
          Content
        </Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toHaveAttribute('aria-label', 'Test Box');
    expect(box).toHaveAttribute('tabindex', '0');
  });
  
  it('adds data-density attribute with current density', () => {
    render(
      <DensityProvider initialDensity={DensityLevel.COMPACT}>
        <Box data-testid="test-box">Content</Box>
      </DensityProvider>
    );
    
    const box = screen.getByTestId('test-box');
    expect(box).toHaveAttribute('data-density', DensityLevel.COMPACT);
  });
});
