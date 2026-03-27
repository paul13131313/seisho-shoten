'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InputForm from '@/components/InputForm';
import Loading from '@/components/Loading';
import BookShelf from '@/components/BookShelf';
import type { SelectBooksResponse } from '@/app/api/select-books/route';

function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [result, setResult] = useState<SelectBooksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/select-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? '選書中にエラーが発生しました');
      }

      setResult(data);

      // URLにクエリを追加（履歴には残す）
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : '選書中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.pushState({}, '', url.toString());
  };

  // URLパラメータからの自動実行
  useEffect(() => {
    if (initialQuery && initialQuery.length >= 5 && !result && !isLoading) {
      handleSubmit(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (result) {
    return <BookShelf result={result} onReset={handleReset} />;
  }

  return (
    <main className="flex-1">
      <InputForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialQuery={initialQuery}
      />

      {error && (
        <div className="max-w-lg mx-auto px-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-500 underline"
            >
              もう一度試す
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}
