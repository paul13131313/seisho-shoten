'use client';

import { useState, useEffect } from 'react';
import { EXAMPLE_QUERIES, INPUT_MAX_LENGTH } from '@/lib/constants';

interface InputFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

function getRandomExamples(count: number): string[] {
  const shuffled = [...EXAMPLE_QUERIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function InputForm({ onSubmit, isLoading, initialQuery }: InputFormProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [examples, setExamples] = useState<string[]>([]);

  useEffect(() => {
    setExamples(getRandomExamples(3));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 5 && !isLoading) {
      onSubmit(query.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg text-center">
        {/* タイトル */}
        <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-serif)] tracking-tight mb-3">
          生成書店
        </h1>
        <p className="text-[var(--text-light)] text-lg mb-10">
          あなたの悩みに、3冊。
        </p>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="いま、何に悩んでいますか？"
              maxLength={INPUT_MAX_LENGTH}
              rows={3}
              disabled={isLoading}
              className="w-full px-5 py-4 text-base bg-white border border-[var(--border)] rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]
                         placeholder:text-[#b8ae9e] resize-none disabled:opacity-50
                         font-[family-name:var(--font-serif)]"
            />
            <span className="absolute bottom-2 right-3 text-xs text-[var(--text-light)]">
              {query.length}/{INPUT_MAX_LENGTH}
            </span>
          </div>

          <button
            type="submit"
            disabled={query.trim().length < 5 || isLoading}
            className="w-full py-3.5 px-6 bg-[var(--accent)] text-white text-base font-bold
                       rounded-xl hover:bg-[#6e1e00] transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed
                       font-[family-name:var(--font-serif)]"
          >
            3冊、選んでもらう
          </button>
        </form>

        {/* 例文 */}
        <div className="mt-8 space-y-2">
          <p className="text-xs text-[var(--text-light)]">例えば：</p>
          <div className="flex flex-wrap justify-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                disabled={isLoading}
                className="text-sm px-3 py-1.5 bg-white border border-[var(--border)] rounded-full
                           hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors
                           disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
