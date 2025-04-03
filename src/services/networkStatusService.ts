/**
 * Service to track and manage network connectivity status
 * Provides methods to check if the app is online and register for notifications
 */
export class NetworkStatusService {
  private online: boolean;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    // Set initial state based on navigator.onLine
    this.online = typeof navigator !== 'undefined' && navigator.onLine;
    
    // Register event listeners if in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners = [];
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.online;
  }

  /**
   * Add a listener for network status changes
   */
  public addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.online);
  }

  /**
   * Register a callback for connectivity changes
   * @param callback Function to call when connectivity changes
   * @returns Function to unregister the callback
   */
  public onConnectivityChange(callback: (isOnline: boolean) => void): () => void {
    this.addListener(callback);
    
    // Return function to remove the listener
    return () => this.removeListener(callback);
  }

  /**
   * Remove a listener
   */
  public removeListener(listener: (isOnline: boolean) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.online = true;
    this.notifyListeners();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.online = false;
    this.notifyListeners();
  };

  /**
   * Notify all listeners of current status
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.online);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusService();
