/**
 * A simple typed event emitter for application events
 * 
 * Example usage:
 * ```
 * const events = new EventEmitter<{
 *   'user-login': { userId: string };
 *   'data-loaded': Array<any>;
 * }>();
 * 
 * // Subscribe to events
 * const unsubscribe = events.on('user-login', (data) => {
 *   console.log('User logged in:', data.userId);
 * });
 * 
 * // Emit events
 * events.emit('user-login', { userId: '123' });
 * 
 * // Unsubscribe when done
 * unsubscribe();
 * ```
 */
export class EventEmitter<T extends Record<string, any>> {
  events: T = {} as T;
  private handlers: { [K in keyof T]?: Array<(data: T[K]) => void> } = {};

  /**
   * Subscribe to an event
   * @param event The event name to subscribe to
   * @param handler The callback function to execute when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event]!.push(handler);

    // Return unsubscribe function
    return () => {
      this.handlers[event] = this.handlers[event]!.filter(h => h !== handler);
    };
  }

  /**
   * Subscribe to an event once - automatically unsubscribes after first execution
   * @param event The event name to subscribe to
   * @param handler The callback function to execute when the event is emitted
   */
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      handler(data);
    });
    
    return unsubscribe;
  }

  /**
   * Emit an event with data
   * @param event The event name to emit
   * @param data The data to pass to event handlers
   */
  emit<K extends keyof T>(event: K, data?: T[K]): void {
    const handlers = this.handlers[event];
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(data as T[K]);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    }
  }

  /**
   * Remove all handlers for a specific event
   * @param event The event to clear handlers for
   */
  off<K extends keyof T>(event: K): void {
    this.handlers[event] = [];
  }

  /**
   * Remove all event handlers
   */
  clear(): void {
    this.handlers = {};
  }
}
