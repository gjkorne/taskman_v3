// Setup for end-to-end tests

// Extend the timeout for Puppeteer operations
jest.setTimeout(30000);

// Global setup function that will run before all tests
beforeAll(async () => {
  // Override console.error to catch specific expected errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Don't log React-specific warnings during tests
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('Warning: ReactDOM.render') || 
         args[0].includes('Error: Not implemented'))) {
      return;
    }
    originalConsoleError(...args);
  };
  
  // Mock local storage for browser tests
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true
    });
  }
});

// Global teardown function that will run after all tests
afterAll(async () => {
  // Add any cleanup needed after all tests
});
