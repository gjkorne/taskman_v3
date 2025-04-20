import { EventEmitter } from '../utils/eventEmitter';
import {
  INetworkStatusService,
  NetworkStatusEvents,
} from './interfaces/INetworkStatusService';

/**
 * Service to track and manage network connectivity status
 * Provides methods to check if the app is online and register for notifications
 */
export class NetworkStatusService implements INetworkStatusService {
  private online: boolean;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private eventEmitter = new EventEmitter<NetworkStatusEvents>();

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
   * Remove a listener
   */
  public removeListener(listener: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Register a callback for connectivity changes
   * @param callback Function to call when connectivity changes
   * @returns Function to unregister the callback
   */
  public onConnectivityChange(
    callback: (isOnline: boolean) => void
  ): () => void {
    this.addListener(callback);
    return () => this.removeListener(callback);
  }

  /**
   * Test connection by making a network request
   * More reliable than just checking navigator.onLine
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Use fetch to a known endpoint that should respond quickly
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const isOnline = response.status >= 200 && response.status < 400;

      // If status changed, update and notify
      if (isOnline !== this.online) {
        this.online = isOnline;
        this.notifyListeners();
      }

      return isOnline;
    } catch (error) {
      // Network error occurred - we're offline
      if (this.online) {
        this.online = false;
        this.notifyListeners();
      }
      return false;
    }
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    if (!this.online) {
      this.online = true;
      this.notifyListeners();
      this.emit('online', true);
      this.emit('status-changed', true);
    }
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    if (this.online) {
      this.online = false;
      this.notifyListeners();
      this.emit('offline', false);
      this.emit('status-changed', false);
    }
  };

  /**
   * Notify all registered listeners of connection status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.online);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // IService interface implementation
  on<K extends keyof NetworkStatusEvents>(
    event: K,
    callback: (data: NetworkStatusEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, callback);
  }

  off<K extends keyof NetworkStatusEvents>(
    event: K,
    _callback?: (data: NetworkStatusEvents[K]) => void
  ): void {
    // EventEmitter's off method only takes the event name and clears all handlers
    // We ignore the callback parameter to match the interface
    this.eventEmitter.off(event);
  }

  emit<K extends keyof NetworkStatusEvents>(
    event: K,
    data?: NetworkStatusEvents[K]
  ): void {
    this.eventEmitter.emit(event, data);
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusService();
