import { useState } from 'react';
import type { MovieResult } from '../types/models';
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
      <div className="rail__list grid place-items-center text-center">
        <div className="max-w-[16rem] p-6">
          <span className="rail__empty-mark" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v16H5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16" />
            </svg>
          </span>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Belum ada hasil pencarian yang disimpan. Cari film dan simpan hasilnya untuk melihatnya di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rail__list">
      <ul className="space-y-2">
        {results.map((result) => {
          const isSelected = result.id === selectedId;
          const isConfirmingDelete = deleteConfirmId === result.id;
          const isDeleting = deletingId === result.id;

          return (
            <li key={result.id}>
              <div
                className={cn(
                  'rounded-lg border p-3 cursor-pointer',
                  'transition-[background-color,border-color,box-shadow] duration-[var(--dur-short)] ease-[var(--ease-out)]',
                  isSelected
                    ? 'ring-2 ring-primary border-transparent bg-accent-soft'
                    : 'border-rule bg-paper hover:bg-paper-2 hover:border-rule-strong',
                  isDeleting && 'opacity-50 pointer-events-none'
                )}
                onClick={() => !isConfirmingDelete && onSelect(result)}
                tabIndex={0}
                role="button"
                aria-label={`Lihat detail ${result.title}`}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isConfirmingDelete) {
                    e.preventDefault();
                    onSelect(result);
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  {isSelected && (
                    <svg className="mt-1 h-4 w-4 shrink-0 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
                    </svg>
                  )}
                  <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-snug text-ink">
                    {result.title}
                  </h3>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {truncateSynopsis(result.synopsis)}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule-2 pt-3">
                  <span className="font-mono text-[0.6875rem] tabular-nums text-ink-2">
                    IMDb: {result.imdbScore.toFixed(1)}/10
                  </span>

                  {!isConfirmingDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(result.id, e)}
                      disabled={isDeleting}
                      aria-label={`Hapus ${result.title}`}
                      className="h-8 px-2 text-xs text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
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
                        aria-label={`Konfirmasi hapus ${result.title}`}
                        className="h-8 px-3 text-xs"
                      >
                        Konfirmasi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        aria-label="Batal hapus"
                        className="h-8 px-3 text-xs"
                      >
                        Batal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
