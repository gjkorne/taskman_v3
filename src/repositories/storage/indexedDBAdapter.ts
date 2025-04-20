import { IStorageAdapter } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * IndexedDB storage adapter for offline-first operations
 * This adapter provides persistent local storage for all data
 */
export class IndexedDBAdapter<T extends { id: string }>
  implements IStorageAdapter<T>
{
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(
    storeName: string,
    options: {
      dbName?: string;
      version?: number;
      transformRow?: (row: any) => T;
      prepareData?: (data: Partial<T>) => Record<string, any>;
    } = {}
  ) {
    this.dbName = options.dbName || 'taskman_offline_db';
    this.storeName = storeName;
    this.version = options.version || 1;
  }

  /**
   * Initialize and open the IndexedDB connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
          console.log(`Created store ${this.storeName}`);
        }
      };
    });
  }

  /**
   * Get all items from the store
   */
  async getAll(): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as T[]);
        };

        request.onerror = (event) => {
          console.error('Error fetching all items:', event);
          reject(new Error('Failed to fetch items from IndexedDB'));
        };
      });
    } catch (error) {
      console.error(`Error in IndexedDB getAll for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result as T);
          } else {
            resolve(null);
          }
        };

        request.onerror = (event) => {
          console.error('Error fetching item by ID:', event);
          reject(
            new Error(`Failed to fetch item with ID ${id} from IndexedDB`)
          );
        };
      });
    } catch (error) {
      console.error(`Error in IndexedDB getById for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const db = await this.getDB();
      // Ensure the item has an ID
      const item = {
        ...data,
        id: data.id || uuidv4(),
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: false, // Track sync status
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.add(item);

        request.onsuccess = () => {
          resolve(item as T);
        };

        request.onerror = (event) => {
          console.error('Error creating item:', event);
          reject(new Error('Failed to create item in IndexedDB'));
        };
      });
    } catch (error) {
      console.error(`Error in IndexedDB create for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const db = await this.getDB();
      const existingItem = await this.getById(id);

      if (!existingItem) {
        throw new Error(`Item with ID ${id} not found`);
      }

      const updatedItem = {
        ...existingItem,
        ...data,
        updated_at: new Date().toISOString(),
        is_synced: false, // Mark as needing sync
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(updatedItem);

        request.onsuccess = () => {
          resolve(updatedItem as T);
        };

        request.onerror = (event) => {
          console.error('Error updating item:', event);
          reject(new Error(`Failed to update item with ID ${id} in IndexedDB`));
        };
      });
    } catch (error) {
      console.error(`Error in IndexedDB update for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Error deleting item:', event);
          reject(
            new Error(`Failed to delete item with ID ${id} from IndexedDB`)
          );
        };
      });
    } catch (error) {
      console.error(`Error in IndexedDB delete for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Query items with a filter function
   */
  async query(filter: (item: T) => boolean): Promise<T[]> {
    try {
      const allItems = await this.getAll();
      return allItems.filter(filter);
    } catch (error) {
      console.error(`Error in IndexedDB query for ${this.storeName}:`, error);
      throw error;
    }
  }

  /**
   * Mark an item as synced with the server
   */
  async markAsSynced(id: string): Promise<void> {
    try {
      const item = await this.getById(id);
      if (item) {
        await this.update(id, { ...item, is_synced: true } as Partial<T>);
      }
    } catch (error) {
      console.error(
        `Error marking item as synced in ${this.storeName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all unsynced items
   */
  async getUnsyncedItems(): Promise<T[]> {
    try {
      const allItems = await this.getAll();
      return allItems.filter((item) => !(item as any).is_synced);
    } catch (error) {
      console.error(
        `Error getting unsynced items from ${this.storeName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clear all data from the store
   */
  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error('Error clearing store:', event);
          reject(new Error(`Failed to clear ${this.storeName} store`));
        };
      });
    } catch (error) {
      console.error(`Error clearing IndexedDB store ${this.storeName}:`, error);
      throw error;
    }
  }
}
