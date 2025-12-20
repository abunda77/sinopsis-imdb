import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initializeGlobalErrorHandlers,
  cleanupGlobalErrorHandlers,
  setCustomErrorHandler,
  withErrorHandling,
  getUserFriendlyErrorMessage,
} from './errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    // Clean up any existing handlers
    cleanupGlobalErrorHandlers();
    setCustomErrorHandler(null);
  });

  afterEach(() => {
    cleanupGlobalErrorHandlers();
    setCustomErrorHandler(null);
  });

  describe('initializeGlobalErrorHandlers', () => {
    it('sets up unhandledrejection listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      initializeGlobalErrorHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('sets up error listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      initializeGlobalErrorHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  describe('cleanupGlobalErrorHandlers', () => {
    it('removes event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      initializeGlobalErrorHandlers();
      cleanupGlobalErrorHandlers();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  describe('setCustomErrorHandler', () => {
    it('allows setting a custom error handler', () => {
      const customHandler = vi.fn();
      setCustomErrorHandler(customHandler);
      
      // This is tested indirectly through withErrorHandling
      expect(customHandler).not.toHaveBeenCalled();
    });
  });

  describe('withErrorHandling', () => {
    it('wraps async function and catches errors', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const customHandler = vi.fn();
      
      setCustomErrorHandler(customHandler);
      const wrappedFn = withErrorHandling(asyncFn, 'test context');
      
      await expect(wrappedFn()).rejects.toThrow('Test error');
      expect(customHandler).toHaveBeenCalledWith(error, 'test context');
    });

    it('passes through successful results', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(asyncFn);
      
      const result = await wrappedFn();
      expect(result).toBe('success');
    });

    it('re-throws errors after handling', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = withErrorHandling(asyncFn);
      
      await expect(wrappedFn()).rejects.toThrow('Test error');
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('returns network error message for network errors', () => {
      const error = new Error('network request failed');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('jaringan');
    });

    it('returns authentication error message for auth errors', () => {
      const error = new Error('authentication failed');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('Autentikasi');
    });

    it('returns database error message for database errors', () => {
      const error = new Error('database connection failed');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('database');
    });

    it('returns timeout error message for timeout errors', () => {
      const error = new Error('request timeout');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('timeout');
    });

    it('returns original message for unmapped errors', () => {
      const error = new Error('Some custom error');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('Some custom error');
    });

    it('handles non-Error objects', () => {
      const message = getUserFriendlyErrorMessage('string error');
      
      expect(message).toContain('tidak diketahui');
    });
  });
});
