import { useState } from 'react';
import type { MovieResult } from '../types/models';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Props for Sidebar component
 */
interface SidebarProps {
  /** Array of saved movie results to display */
  results: MovieResult[];
  /** Callback when a sidebar entry is clicked */
  onSelect: (result: MovieResult) => void;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => Promise<void>;
  /** ID of the currently selected result */
  selectedId: string | null;
}

/**
 * Sidebar component that displays saved movie results
 * Allows users to select results to view details and delete entries
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.5, 7.1, 7.2, 7.3
 */
export function Sidebar({ results, onSelect, onDelete, selectedId }: SidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Handle delete button click - show confirmation dialog
   */
  const handleDeleteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelect
    setDeleteConfirmId(id);
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelect
    setDeletingId(id);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete failed:', error);
      // Error handling is done by parent component
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle cancel delete
   */
  const handleCancelDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelect
    setDeleteConfirmId(null);
  };

  /**
   * Truncate synopsis for preview (show first 100 characters)
   */
  const truncateSynopsis = (synopsis: string, maxLength: number = 100): string => {
    if (synopsis.length <= maxLength) {
      return synopsis;
    }
    return synopsis.substring(0, maxLength) + '...';
  };

  // Display empty state when no results
  if (results.length === 0) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Belum ada hasil pencarian yang disimpan. Cari film dan simpan hasilnya untuk melihatnya di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="space-y-3">
        {results.map((result) => {
          const isSelected = result.id === selectedId;
          const isConfirmingDelete = deleteConfirmId === result.id;
          const isDeleting = deletingId === result.id;

          return (
            <Card
              key={result.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-blue-300',
                'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
                'border-2',
                isSelected && 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 shadow-md',
                isDeleting && 'opacity-50 pointer-events-none'
              )}
              onClick={() => !isConfirmingDelete && onSelect(result)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${result.title}`}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isConfirmingDelete) {
                  e.preventDefault();
                  onSelect(result);
                }
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-start gap-2">
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="line-clamp-2">{result.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {truncateSynopsis(result.synopsis, 80)}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">
                      {result.imdbScore.toFixed(1)}
                    </span>
                  </div>
                  {!isConfirmingDelete ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDeleteClick(result.id, e)}
                      disabled={isDeleting}
                      aria-label={`Delete ${result.title}`}
                      className="h-8 px-3 text-xs"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </Button>
                  ) : (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleConfirmDelete(result.id, e)}
                        disabled={isDeleting}
                        aria-label={`Confirm delete ${result.title}`}
                        className="h-8 px-2 text-xs"
                      >
                        Ya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        aria-label="Cancel delete"
                        className="h-8 px-2 text-xs"
                      >
                        Batal
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
