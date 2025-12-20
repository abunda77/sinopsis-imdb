import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { MovieResult } from '../types/models';

describe('Sidebar Component', () => {
  const mockResults: MovieResult[] = [
    {
      id: '1',
      title: 'The Matrix',
      synopsis: 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.',
      imdbScore: 8.7,
      searchedAt: new Date('2024-01-01'),
      savedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Inception',
      synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
      imdbScore: 8.8,
      searchedAt: new Date('2024-01-02'),
      savedAt: new Date('2024-01-02'),
    },
  ];

  it('displays empty state when no results', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={[]} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    expect(screen.getByText(/Belum ada hasil pencarian yang disimpan/i)).toBeInTheDocument();
  });

  it('displays list of saved movie results', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  it('shows movie title and synopsis preview for each entry', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    // Check titles
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();

    // Check synopsis previews (truncated)
    expect(screen.getByText(/A computer hacker learns/i)).toBeInTheDocument();
    expect(screen.getByText(/A thief who steals/i)).toBeInTheDocument();

    // Check IMDb scores
    expect(screen.getByText('IMDb: 8.7/10')).toBeInTheDocument();
    expect(screen.getByText('IMDb: 8.8/10')).toBeInTheDocument();
  });

  it('calls onSelect when entry is clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    const matrixCard = screen.getByText('The Matrix').closest('div[class*="rounded-lg"]');
    fireEvent.click(matrixCard!);

    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('highlights currently selected entry', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId="1" />);

    const matrixCard = screen.getByText('The Matrix').closest('div[class*="rounded-lg"]');
    expect(matrixCard).toHaveClass('ring-2', 'ring-primary');
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    const deleteButtons = screen.getAllByText('Hapus');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Konfirmasi')).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    // Click delete button
    const deleteButtons = screen.getAllByText('Hapus');
    fireEvent.click(deleteButtons[0]);

    // Click confirm button
    const confirmButton = screen.getByText('Konfirmasi');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('1');
    });
  });

  it('cancels delete when cancel button is clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={mockResults} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    // Click delete button
    const deleteButtons = screen.getAllByText('Hapus');
    fireEvent.click(deleteButtons[0]);

    // Click cancel button
    const cancelButton = screen.getByText('Batal');
    fireEvent.click(cancelButton);

    // Confirmation dialog should be hidden
    expect(screen.queryByText('Konfirmasi')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('truncates long synopsis to preview length', () => {
    const longSynopsis = 'A'.repeat(200);
    const resultWithLongSynopsis: MovieResult = {
      id: '3',
      title: 'Long Movie',
      synopsis: longSynopsis,
      imdbScore: 7.5,
      searchedAt: new Date(),
      savedAt: new Date(),
    };

    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<Sidebar results={[resultWithLongSynopsis]} onSelect={onSelect} onDelete={onDelete} selectedId={null} />);

    const synopsisElement = screen.getByText(/A{100}\.\.\./);
    expect(synopsisElement).toBeInTheDocument();
  });
});
