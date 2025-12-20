import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from './database';
import type { MovieResult } from '../types/models';

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(),
  close: vi.fn(),
  objectStoreNames: { contains: vi.fn() }
};

const mockObjectStore = {
  add: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore)
};

const mockIndex = {
  get: vi.fn()
};

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    dbService = new DatabaseService();
    
    // Mock indexedDB.open
    globalThis.indexedDB = {
      open: vi.fn((_name: string, _version: number) => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: mockDB
        };
        
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess();
          }
        }, 0);
        
        return request;
      })
    } as any;
  });

  describe('initialize', () => {
    it('should initialize the database', async () => {
      await dbService.initialize();
      expect(globalThis.indexedDB.open).toHaveBeenCalled();
    });
  });

  describe('saveResult', () => {
    it('should save a movie result to the database', async () => {
      await dbService.initialize();
      
      const result: MovieResult = {
        id: crypto.randomUUID(),
        title: 'The Matrix',
        synopsis: 'A computer hacker learns about the true nature of reality.',
        imdbScore: 8.7,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      mockDB.transaction.mockReturnValue(mockTransaction);
      mockIndex.get.mockImplementation(() => ({
        onsuccess: null as any,
        onerror: null as any,
        result: null
      }));
      mockObjectStore.index.mockReturnValue(mockIndex);
      mockObjectStore.add.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });

      await dbService.saveResult(result);
      
      expect(mockDB.transaction).toHaveBeenCalled();
      expect(mockObjectStore.add).toHaveBeenCalled();
    });
  });

  describe('getAllResults', () => {
    it('should return all saved results', async () => {
      await dbService.initialize();
      
      const mockResults = [
        {
          id: '1',
          title: 'Movie 1',
          synopsis: 'Synopsis 1',
          imdbScore: 7.5,
          searchedAt: new Date('2024-01-01').toISOString(),
          savedAt: new Date('2024-01-01').toISOString()
        }
      ];

      mockDB.transaction.mockReturnValue(mockTransaction);
      mockObjectStore.getAll.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          result: mockResults
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });

      const results = await dbService.getAllResults();
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Movie 1');
    });
  });

  describe('getResultById', () => {
    it('should return null when result not found', async () => {
      await dbService.initialize();
      
      mockDB.transaction.mockReturnValue(mockTransaction);
      mockObjectStore.get.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          result: undefined
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });

      const result = await dbService.getResultById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('deleteResult', () => {
    it('should delete a result by id', async () => {
      await dbService.initialize();
      
      mockDB.transaction.mockReturnValue(mockTransaction);
      mockObjectStore.get.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          result: { id: '1', title: 'Test' }
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });
      mockObjectStore.delete.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });

      await dbService.deleteResult('1');
      
      expect(mockObjectStore.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('resultExists', () => {
    it('should return false when result does not exist', async () => {
      await dbService.initialize();
      
      mockDB.transaction.mockReturnValue(mockTransaction);
      mockIndex.get.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          result: undefined
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });
      mockObjectStore.index.mockReturnValue(mockIndex);

      const exists = await dbService.resultExists('Non-existent Movie');
      expect(exists).toBe(false);
    });

    it('should return true when result exists', async () => {
      await dbService.initialize();
      
      mockDB.transaction.mockReturnValue(mockTransaction);
      mockIndex.get.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          result: { title: 'Pulp Fiction' }
        };
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });
      mockObjectStore.index.mockReturnValue(mockIndex);

      const exists = await dbService.resultExists('Pulp Fiction');
      expect(exists).toBe(true);
    });
  });
});
