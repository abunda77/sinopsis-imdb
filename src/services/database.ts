import type { MovieResult } from '../types/models';

const DB_NAME = 'movie-synopsis-db';
const STORE_NAME = 'movie_results';
const DB_VERSION = 1;

/**
 * DatabaseService handles all IndexedDB operations for movie results
 */
export class DatabaseService {
  private db: IDBDatabase | null = null;

  constructor() {}

  /**
   * Initialize the database and create the schema if it doesn't exist
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open database'));
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('title', 'title', { unique: true });
          objectStore.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a movie result to the database
   * Throws an error if a result with the same title already exists
   */
  async saveResult(result: MovieResult): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Check for duplicates
    const exists = await this.resultExists(result.title);
    if (exists) {
      throw new Error(`A movie with title "${result.title}" already exists in the database.`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        ...result,
        searchedAt: result.searchedAt.toISOString(),
        savedAt: result.savedAt ? result.savedAt.toISOString() : new Date().toISOString()
      };
      
      const request = store.add(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save result'));
    });
  }

  /**
   * Get all movie results from the database, ordered by saved_at descending
   */
  async getAllResults(): Promise<MovieResult[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((row: any) => ({
          id: row.id,
          title: row.title,
          synopsis: row.synopsis,
          imdbScore: row.imdbScore,
          searchedAt: new Date(row.searchedAt),
          savedAt: new Date(row.savedAt)
        }));
        
        // Sort by savedAt descending
        results.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
        resolve(results);
      };

      request.onerror = () => reject(new Error('Failed to get results'));
    });
  }

  /**
   * Get a specific movie result by ID
   */
  async getResultById(id: string): Promise<MovieResult | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const row = request.result;
        if (!row) {
          resolve(null);
          return;
        }

        resolve({
          id: row.id,
          title: row.title,
          synopsis: row.synopsis,
          imdbScore: row.imdbScore,
          searchedAt: new Date(row.searchedAt),
          savedAt: new Date(row.savedAt)
        });
      };

      request.onerror = () => reject(new Error('Failed to get result'));
    });
  }

  /**
   * Delete a movie result by ID
   */
  async deleteResult(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Check if exists first
    const exists = await this.getResultById(id);
    if (!exists) {
      throw new Error(`No movie result found with id "${id}".`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete result'));
    });
  }

  /**
   * Check if a movie result with the given title already exists
   */
  async resultExists(title: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('title');
      const request = index.get(title);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(new Error('Failed to check if result exists'));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
