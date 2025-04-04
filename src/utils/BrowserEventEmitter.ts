/**
 * A simple browser-compatible EventEmitter implementation
 * Provides similar functionality to Node.js EventEmitter but works in browser environments
 */
export class BrowserEventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  /**
   * Add an event listener
   * @param event Event name
   * @param listener Function to call when event is emitted
   */
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Add a one-time event listener
   * @param event Event name
   * @param listener Function to call when event is emitted
   */
  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param listener Function to remove
   */
  off(event: string, listener: (...args: any[]) => void): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }

  /**
   * Remove all listeners for an event, or all events
   * @param event Optional event name
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        listener(...args);
      });
      return true;
    }
    return false;
  }

  /**
   * Get listeners for an event
   * @param event Event name
   */
  listeners(event: string): Array<(...args: any[]) => void> {
    return this.events[event] || [];
  }
}
