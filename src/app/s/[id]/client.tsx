'use client';

import BookShelf from '@/components/BookShelf';
import type { SelectBooksResponse } from '@/app/api/select-books/route';
import type { BookResult } from '@/app/api/select-books/route';

interface SharePageClientProps {
  id: string;
  query: string;
  storyline: string;
  books: BookResult[];
}

export default function SharePageClient({ id, query, storyline, books }: SharePageClientProps) {
  const result: SelectBooksResponse = { id, query, storyline, books };

  const handleReset = () => {
    window.location.href = '/';
  };

  return <BookShelf result={result} onReset={handleReset} />;
}
