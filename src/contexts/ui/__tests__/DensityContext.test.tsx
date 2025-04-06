import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  DensityProvider, 
  useDensity, 
  DensityLevel 
} from '../DensityContext';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component that uses the density context
const TestComponent: React.FC = () => {
  const { density, setDensity, toggleDensity } = useDensity();
  
  return (
    <div data-testid="test-component">
      <p data-testid="density-value">{density}</p>
      <button 
        data-testid="set-compact-btn"
        onClick={() => setDensity(DensityLevel.COMPACT)}
      >
        Set Compact
      </button>
      <button 
        data-testid="set-normal-btn"
        onClick={() => setDensity(DensityLevel.NORMAL)}
      >
        Set Normal
      </button>
      <button 
        data-testid="set-comfortable-btn"
        onClick={() => setDensity(DensityLevel.COMFORTABLE)}
      >
        Set Comfortable
      </button>
      <button 
        data-testid="toggle-btn"
        onClick={() => toggleDensity()}
      >
        Toggle Density
      </button>
    </div>
  );
};

describe('DensityContext', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });
  
  it('should use normal density by default', () => {
    render(
      <DensityProvider>
        <TestComponent />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.NORMAL);
  });
  
  it('should read saved preference from localStorage on mount', () => {
    // Set a saved preference
    mockLocalStorage.setItem('taskman_density_preference', DensityLevel.COMPACT);
    
    render(
      <DensityProvider>
        <TestComponent />
      </DensityProvider>
    );
    
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.COMPACT);
  });
  
  it('should update density when setDensity is called', () => {
    render(
      <DensityProvider>
        <TestComponent />
      </DensityProvider>
    );
    
    // Initial state
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.NORMAL);
    
    // Change to compact
    fireEvent.click(screen.getByTestId('set-compact-btn'));
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.COMPACT);
    
    // Change to comfortable
    fireEvent.click(screen.getByTestId('set-comfortable-btn'));
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.COMFORTABLE);
  });
  
  it('should save preference to localStorage when density changes', () => {
    render(
      <DensityProvider>
        <TestComponent />
      </DensityProvider>
    );
    
    // Change to compact
    fireEvent.click(screen.getByTestId('set-compact-btn'));
    
    // Check localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'taskman_density_preference',
      DensityLevel.COMPACT
    );
  });
  
  it('should cycle through densities when toggleDensity is called', () => {
    render(
      <DensityProvider>
        <TestComponent />
      </DensityProvider>
    );
    
    // Initial state
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.NORMAL);
    
    // First toggle: normal -> comfortable
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.COMFORTABLE);
    
    // Second toggle: comfortable -> compact
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.COMPACT);
    
    // Third toggle: compact -> normal
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('density-value').textContent).toBe(DensityLevel.NORMAL);
  });
  
  it('should throw an error when useDensity is used outside of DensityProvider', () => {
    // Silence the expected error in the console
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Act in try/catch to handle the expected error
    try {
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useDensity must be used within a DensityProvider');
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});
