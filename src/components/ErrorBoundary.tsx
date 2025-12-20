import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component for catching React errors
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Requirements:
 * - 1.4: Display error messages when operations fail
 * - 2.3: Display error message and maintain state on save failure
 * - 5.3: Display error message and maintain state on delete failure
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details for debugging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging (Requirement: Log errors for debugging)
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // In production, you might want to send this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  /**
   * Reset error state to allow recovery
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render fallback UI when error occurs
   */
  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default fallback UI (Requirement: Display user-friendly error messages)
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertTitle className="text-lg font-semibold">
                Oops! Terjadi Kesalahan
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  Aplikasi mengalami kesalahan yang tidak terduga. Kami mohon maaf atas ketidaknyamanan ini.
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium hover:underline">
                    Detail Teknis (untuk debugging)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-60">
                    <p className="font-semibold text-destructive">Error:</p>
                    <p className="mb-2">{error.message}</p>
                    {error.stack && (
                      <>
                        <p className="font-semibold text-destructive mt-2">Stack Trace:</p>
                        <pre className="whitespace-pre-wrap">{error.stack}</pre>
                      </>
                    )}
                  </div>
                </details>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={this.resetError} variant="default">
                Coba Lagi
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Muat Ulang Halaman
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based wrapper for ErrorBoundary (optional convenience)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, resetError: () => void) => ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
