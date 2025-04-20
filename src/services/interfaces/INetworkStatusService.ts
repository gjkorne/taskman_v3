import { IService } from './IService';

/**
 * Events that can be emitted by the NetworkStatusService
 */
export interface NetworkStatusEvents {
  online: boolean;
  offline: boolean;
  'status-changed': boolean;
}

/**
 * Interface for the NetworkStatusService
 * Provides methods to check and monitor network connectivity
 */
export interface INetworkStatusService extends IService<NetworkStatusEvents> {
  /**
   * Check if the application currently has network connectivity
   * @returns True if online, false otherwise
   */
  isOnline(): boolean;

  /**
   * Add a listener for network status changes
   * @param listener Callback function that receives the online status
   */
  addListener(listener: (isOnline: boolean) => void): void;

  /**
   * Remove a previously registered listener
   * @param listener The listener to remove
   */
  removeListener(listener: (isOnline: boolean) => void): void;

  /**
   * Register a callback for connectivity changes
   * @param callback Function to call when connectivity changes
   * @returns Function to unregister the callback
   */
  onConnectivityChange(callback: (isOnline: boolean) => void): () => void;

  /**
   * Manually test the connection by making a network request
   * More reliable than just checking navigator.onLine
   * @returns Promise resolving to true if online, false otherwise
   */
  testConnection(): Promise<boolean>;

  /**
   * Clean up resources used by this service
   */
  destroy(): void;
}
