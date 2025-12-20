/**
 * Global error handler for unhandled promise rejections and errors
 * 
 * This module sets up global error handlers to catch errors that escape
 * component boundaries and promise rejections that aren't caught.
 * 
 * Requirements:
 * - 1.4: Display error messages when operations fail
 * - 2.3: Handle save operation failures
 * - 5.3: Handle delete operation failures
 */

/**
 * Error handler callback type
 */
type ErrorHandler = (error: Error, context?: string) => void;

/**
 * Default error handler that logs to console
 */
const defaultErrorHandler: ErrorHandler = (error: Error, context?: string) => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  
  console.error(`[${timestamp}]${contextStr} Unhandled error:`, error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
};

/**
 * Custom error handler (can be set by application)
 */
let customErrorHandler: ErrorHandler | null = null;

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // Prevent default browser behavior (logging to console)
  event.preventDefault();

  // Extract error from rejection
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));

  // Log error for debugging
  const handler = customErrorHandler || defaultErrorHandler;
  handler(error, 'Unhandled Promise Rejection');

  // In production, you might want to:
  // - Send error to monitoring service
  // - Show user-friendly notification
  // - Track error metrics
}

/**
 * Handle global errors
 */
function handleGlobalError(event: ErrorEvent): void {
  // Prevent default browser behavior
  event.preventDefault();

  // Extract error
  const error = event.error instanceof Error 
    ? event.error 
    : new Error(event.message);

  // Log error for debugging
  const handler = customErrorHandler || defaultErrorHandler;
  handler(error, 'Global Error');
}

/**
 * Initialize global error handlers
 * Should be called once at application startup
 */
export function initializeGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Handle global errors
  window.addEventListener('error', handleGlobalError);

  console.log('[ErrorHandler] Global error handlers initialized');
}

/**
 * Cleanup global error handlers
 * Should be called when application is unmounting (e.g., in tests)
 */
export function cleanupGlobalErrorHandlers(): void {
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  window.removeEventListener('error', handleGlobalError);

  console.log('[ErrorHandler] Global error handlers cleaned up');
}

/**
 * Set a custom error handler
 * Useful for sending errors to monitoring services or showing notifications
 */
export function setCustomErrorHandler(handler: ErrorHandler | null): void {
  customErrorHandler = handler;
}

/**
 * Utility function to wrap async functions with error handling
 * Useful for ensuring promise rejections are properly caught
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const handler = customErrorHandler || defaultErrorHandler;
      handler(err, context);
      throw error; // Re-throw to allow local handling
    }
  }) as T;
}

/**
 * Create a user-friendly error message from an error object
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common error types to user-friendly messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda dan coba lagi.';
    }
    
    if (error.message.includes('authentication') || error.message.includes('401')) {
      return 'Autentikasi gagal. Periksa API key Anda.';
    }
    
    if (error.message.includes('database') || error.message.includes('SQLite')) {
      return 'Terjadi kesalahan database. Coba muat ulang aplikasi.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Permintaan timeout. Coba lagi dalam beberapa saat.';
    }
    
    // Return original message if no mapping found
    return error.message;
  }
  
  return 'Terjadi kesalahan yang tidak diketahui.';
}
