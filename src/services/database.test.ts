import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './database';
import type { MovieResult } from '../types/models';
import { randomUUID } from 'crypto';
import { unlinkSync, existsSync } from 'fs';
import * as fc from 'fast-check';

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  const testDbPath = 'test-movie-synopsis.db';

  beforeEach(() => {
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    dbService = new DatabaseService(testDbPath);
    dbService.initialize();
  });

  afterEach(() => {
    dbService.close();
    // Clean up test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('initialize', () => {
    it('should create database and tables', () => {
      // Database should be initialized in beforeEach
      expect(() => dbService.getAllResults()).not.toThrow();
    });
  });

  describe('saveResult', () => {
    it('should save a movie result to the database', () => {
      const result: MovieResult = {
        id: randomUUID(),
        title: 'The Matrix',
        synopsis: 'A computer hacker learns about the true nature of reality.',
        imdbScore: 8.7,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      dbService.saveResult(result);

      const saved = dbService.getResultById(result.id);
      expect(saved).not.toBeNull();
      expect(saved?.title).toBe(result.title);
      expect(saved?.synopsis).toBe(result.synopsis);
      expect(saved?.imdbScore).toBe(result.imdbScore);
    });

    it('should throw error when saving duplicate title', () => {
      const result1: MovieResult = {
        id: randomUUID(),
        title: 'Inception',
        synopsis: 'A thief who steals corporate secrets.',
        imdbScore: 8.8,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      const result2: MovieResult = {
        id: randomUUID(),
        title: 'Inception', // Same title
        synopsis: 'Different synopsis.',
        imdbScore: 9.0,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      dbService.saveResult(result1);
      expect(() => dbService.saveResult(result2)).toThrow();
    });
  });

  describe('getAllResults', () => {
    it('should return empty array when no results', () => {
      const results = dbService.getAllResults();
      expect(results).toEqual([]);
    });

    it('should return all saved results ordered by saved_at descending', () => {
      const result1: MovieResult = {
        id: randomUUID(),
        title: 'Movie 1',
        synopsis: 'Synopsis 1',
        imdbScore: 7.5,
        searchedAt: new Date('2024-01-01'),
        savedAt: new Date('2024-01-01')
      };

      const result2: MovieResult = {
        id: randomUUID(),
        title: 'Movie 2',
        synopsis: 'Synopsis 2',
        imdbScore: 8.0,
        searchedAt: new Date('2024-01-02'),
        savedAt: new Date('2024-01-02')
      };

      dbService.saveResult(result1);
      dbService.saveResult(result2);

      const results = dbService.getAllResults();
      expect(results).toHaveLength(2);
      // Should be ordered by saved_at descending (newest first)
      expect(results[0].title).toBe('Movie 2');
      expect(results[1].title).toBe('Movie 1');
    });
  });

  describe('getResultById', () => {
    it('should return null when result not found', () => {
      const result = dbService.getResultById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return the correct result by id', () => {
      const result: MovieResult = {
        id: randomUUID(),
        title: 'Interstellar',
        synopsis: 'A team of explorers travel through a wormhole.',
        imdbScore: 8.6,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      dbService.saveResult(result);

      const retrieved = dbService.getResultById(result.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(result.id);
      expect(retrieved?.title).toBe(result.title);
    });
  });

  describe('deleteResult', () => {
    it('should delete a result by id', () => {
      const result: MovieResult = {
        id: randomUUID(),
        title: 'The Dark Knight',
        synopsis: 'Batman faces the Joker.',
        imdbScore: 9.0,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      dbService.saveResult(result);
      expect(dbService.getResultById(result.id)).not.toBeNull();

      dbService.deleteResult(result.id);
      expect(dbService.getResultById(result.id)).toBeNull();
    });

    it('should throw error when deleting non-existent result', () => {
      expect(() => dbService.deleteResult('non-existent-id')).toThrow();
    });
  });

  describe('resultExists', () => {
    it('should return false when result does not exist', () => {
      expect(dbService.resultExists('Non-existent Movie')).toBe(false);
    });

    it('should return true when result exists', () => {
      const result: MovieResult = {
        id: randomUUID(),
        title: 'Pulp Fiction',
        synopsis: 'Various interconnected stories.',
        imdbScore: 8.9,
        searchedAt: new Date(),
        savedAt: new Date()
      };

      dbService.saveResult(result);
      expect(dbService.resultExists('Pulp Fiction')).toBe(true);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: movie-synopsis-finder, Property 6: Save operation persists all fields
     * Validates: Requirements 2.1
     * 
     * For any valid movie result, when saved to the database, querying by title
     * should return a result with identical title, synopsis, IMDb score, and a valid timestamp.
     */
    it('Property 6: Save operation persists all fields', { timeout: 60000 }, () => {
      // Generator for valid dates using timestamps
      const validDateArbitrary = fc.integer({ 
        min: new Date('2000-01-01').getTime(), 
        max: new Date('2030-12-31').getTime() 
      }).map(timestamp => new Date(timestamp));

      // Generator for valid movie results
      const movieResultArbitrary = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        synopsis: fc.string({ minLength: 1, maxLength: 5000 }),
        imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        searchedAt: validDateArbitrary,
        savedAt: validDateArbitrary
      });

      fc.assert(
        fc.property(movieResultArbitrary, (result) => {
          // Save the result to the database
          dbService.saveResult(result);

          // Query by ID to retrieve the saved result
          const retrieved = dbService.getResultById(result.id);

          // Verify all fields are persisted correctly
          expect(retrieved).not.toBeNull();
          expect(retrieved!.id).toBe(result.id);
          expect(retrieved!.title).toBe(result.title);
          expect(retrieved!.synopsis).toBe(result.synopsis);
          expect(retrieved!.imdbScore).toBeCloseTo(result.imdbScore, 10);
          
          // Verify timestamps are valid and match (within reasonable precision)
          expect(retrieved!.searchedAt).toBeInstanceOf(Date);
          expect(retrieved!.savedAt).toBeInstanceOf(Date);
          expect(retrieved!.searchedAt.getTime()).toBe(result.searchedAt.getTime());
          expect(retrieved!.savedAt!.getTime()).toBe(result.savedAt!.getTime());

          // Clean up: delete the result for the next iteration
          dbService.deleteResult(result.id);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: movie-synopsis-finder, Property 7: Duplicate prevention
     * Validates: Requirements 2.2
     * 
     * For any movie title already saved in the database, attempting to save another
     * result with the same title should be rejected.
     */
    it('Property 7: Duplicate prevention', { timeout: 60000 }, () => {
      // Generator for valid dates using timestamps
      const validDateArbitrary = fc.integer({ 
        min: new Date('2000-01-01').getTime(), 
        max: new Date('2030-12-31').getTime() 
      }).map(timestamp => new Date(timestamp));

      // Generator for valid movie results
      const movieResultArbitrary = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        synopsis: fc.string({ minLength: 1, maxLength: 5000 }),
        imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        searchedAt: validDateArbitrary,
        savedAt: validDateArbitrary
      });

      fc.assert(
        fc.property(movieResultArbitrary, movieResultArbitrary, (result1, result2) => {
          // Create two results with the same title but different IDs and other fields
          const firstResult = { ...result1 };
          const secondResult = {
            ...result2,
            id: randomUUID(), // Ensure different ID
            title: firstResult.title // Use the same title
          };

          // Save the first result
          dbService.saveResult(firstResult);

          // Verify the first result exists
          expect(dbService.resultExists(firstResult.title)).toBe(true);

          // Attempt to save the second result with the same title
          // This should throw an error
          expect(() => dbService.saveResult(secondResult)).toThrow();

          // Verify that only the first result is in the database
          const allResults = dbService.getAllResults();
          const resultsWithTitle = allResults.filter(r => r.title === firstResult.title);
          expect(resultsWithTitle).toHaveLength(1);
          expect(resultsWithTitle[0].id).toBe(firstResult.id);

          // Clean up: delete the first result for the next iteration
          dbService.deleteResult(firstResult.id);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: movie-synopsis-finder, Property 12: Initial load displays all saved results
     * Validates: Requirements 4.1
     * 
     * For any set of movie results in the database, when the application loads,
     * all results should appear in the sidebar.
     */
    it('Property 12: Initial load displays all saved results', { timeout: 120000 }, () => {
      // Generator for valid dates using timestamps
      const validDateArbitrary = fc.integer({ 
        min: new Date('2000-01-01').getTime(), 
        max: new Date('2030-12-31').getTime() 
      }).map(timestamp => new Date(timestamp));

      // Generator for valid movie results with unique titles
      const movieResultArbitrary = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        synopsis: fc.string({ minLength: 1, maxLength: 500 }),
        imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        searchedAt: validDateArbitrary,
        savedAt: validDateArbitrary
      });

      // Generate an array of movie results (0 to 5 results for faster execution)
      const movieResultsArrayArbitrary = fc.array(movieResultArbitrary, { minLength: 0, maxLength: 5 });

      fc.assert(
        fc.property(movieResultsArrayArbitrary, (results) => {
          // Ensure unique titles to avoid duplicate errors
          const uniqueResults = results.reduce((acc, result) => {
            if (!acc.some(r => r.title === result.title)) {
              acc.push(result);
            }
            return acc;
          }, [] as MovieResult[]);

          // Save all results to the database
          uniqueResults.forEach(result => {
            dbService.saveResult(result);
          });

          // Simulate initial load by calling getAllResults
          const loadedResults = dbService.getAllResults();

          // Verify that all saved results are returned
          expect(loadedResults).toHaveLength(uniqueResults.length);

          // Verify each saved result is present in the loaded results
          uniqueResults.forEach(savedResult => {
            const found = loadedResults.find(r => r.id === savedResult.id);
            expect(found).toBeDefined();
            expect(found!.title).toBe(savedResult.title);
            expect(found!.synopsis).toBe(savedResult.synopsis);
            expect(found!.imdbScore).toBeCloseTo(savedResult.imdbScore, 10);
          });

          // Verify results are ordered by saved_at descending (newest first)
          for (let i = 0; i < loadedResults.length - 1; i++) {
            expect(loadedResults[i].savedAt).not.toBeNull();
            expect(loadedResults[i + 1].savedAt).not.toBeNull();
            expect(loadedResults[i].savedAt!.getTime()).toBeGreaterThanOrEqual(
              loadedResults[i + 1].savedAt!.getTime()
            );
          }

          // Clean up: delete all results for the next iteration
          uniqueResults.forEach(result => {
            dbService.deleteResult(result.id);
          });

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
