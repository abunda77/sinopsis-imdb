import Database from 'better-sqlite3';
import type { MovieResult } from '../types/models';

/**
 * DatabaseService handles all SQLite database operations for movie results
 */
export class DatabaseService {
  private db: Database.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath: string = 'movie-synopsis.db') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize the database and create the schema if it doesn't exist
   */
  initialize(): void {
    this.db = new Database(this.dbPath);

    // Create the movie_results table with constraints
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS movie_results (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL UNIQUE,
        synopsis TEXT NOT NULL,
        imdb_score REAL NOT NULL,
        searched_at TEXT NOT NULL,
        saved_at TEXT NOT NULL,
        CHECK (imdb_score >= 0 AND imdb_score <= 10)
      );

      CREATE INDEX IF NOT EXISTS idx_title ON movie_results(title);
      CREATE INDEX IF NOT EXISTS idx_saved_at ON movie_results(saved_at DESC);
    `);
  }

  /**
   * Save a movie result to the database
   * Throws an error if a result with the same title already exists
   */
  saveResult(result: MovieResult): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Check for duplicates
    if (this.resultExists(result.title)) {
      throw new Error(`A movie with title "${result.title}" already exists in the database.`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO movie_results (id, title, synopsis, imdb_score, searched_at, saved_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.id,
      result.title,
      result.synopsis,
      result.imdbScore,
      result.searchedAt.toISOString(),
      result.savedAt ? result.savedAt.toISOString() : new Date().toISOString()
    );
  }

  /**
   * Get all movie results from the database, ordered by saved_at descending
   */
  getAllResults(): MovieResult[] {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const stmt = this.db.prepare(`
      SELECT id, title, synopsis, imdb_score, searched_at, saved_at
      FROM movie_results
      ORDER BY saved_at DESC
    `);

    const rows = stmt.all() as Array<{
      id: string;
      title: string;
      synopsis: string;
      imdb_score: number;
      searched_at: string;
      saved_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      synopsis: row.synopsis,
      imdbScore: row.imdb_score,
      searchedAt: new Date(row.searched_at),
      savedAt: new Date(row.saved_at)
    }));
  }

  /**
   * Get a specific movie result by ID
   */
  getResultById(id: string): MovieResult | null {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const stmt = this.db.prepare(`
      SELECT id, title, synopsis, imdb_score, searched_at, saved_at
      FROM movie_results
      WHERE id = ?
    `);

    const row = stmt.get(id) as {
      id: string;
      title: string;
      synopsis: string;
      imdb_score: number;
      searched_at: string;
      saved_at: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      synopsis: row.synopsis,
      imdbScore: row.imdb_score,
      searchedAt: new Date(row.searched_at),
      savedAt: new Date(row.saved_at)
    };
  }

  /**
   * Delete a movie result by ID
   */
  deleteResult(id: string): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const stmt = this.db.prepare(`
      DELETE FROM movie_results WHERE id = ?
    `);

    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`No movie result found with id "${id}".`);
    }
  }

  /**
   * Check if a movie result with the given title already exists
   */
  resultExists(title: string): boolean {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM movie_results WHERE title = ?
    `);

    const result = stmt.get(title) as { count: number };
    return result.count > 0;
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
