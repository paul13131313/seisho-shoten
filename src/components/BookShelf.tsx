'use client';

import type { SelectBooksResponse } from '@/app/api/select-books/route';
import BookCard from './BookCard';

interface BookShelfProps {
  result: SelectBooksResponse;
  onReset: () => void;
}

export default function BookShelf({ result, onReset }: BookShelfProps) {
  const pageUrl = result.id
    ? `https://seisho-shoten.vercel.app/s/${result.id}`
    : `https://seisho-shoten.vercel.app/?q=${encodeURIComponent(result.query)}`;

  const shareText = `「${result.query}」\nAIに選んでもらった3冊 📚\n\n${result.books.map((b) => `${b.order}. ${b.title}`).join('\n')}\n\n${pageUrl}\n\n#生成書店`;

  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* ヘッダー */}
      <div className="text-center mb-8 animate-fade-in-up" style={{ opacity: 0 }}>
        <p className="text-sm text-[var(--text-light)] mb-2">
          「{result.query}」
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-serif)]">
          あなたのための3冊
        </h2>
      </div>

      {/* ストーリーライン */}
      <div
        className="bg-white border border-[var(--border)] rounded-xl px-6 py-5 mb-10 animate-fade-in-up"
        style={{ animationDelay: '0.1s', opacity: 0 }}
      >
        <p className="text-sm font-[family-name:var(--font-serif)] leading-relaxed text-[var(--text)]">
          {result.storyline}
        </p>
      </div>

      {/* 3冊の棚 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-6 sm:gap-4 mb-10">
        {result.books.map((book, i) => (
          <div key={book.order} className="flex items-center gap-4 sm:gap-2">
            <BookCard book={book} index={i} />
            {i < 2 && (
              <span className="hidden sm:block text-[var(--text-light)] text-lg mt-[-40px]">
                →
              </span>
            )}
            {i < 2 && (
              <span className="sm:hidden text-[var(--text-light)] text-lg rotate-90">
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 各本の選書理由 */}
      <div className="space-y-4 mb-10">
        {result.books.map((book, i) => (
          <div
            key={book.order}
            className="bg-white border border-[var(--border)] rounded-xl px-5 py-4 animate-fade-in-up"
            style={{ animationDelay: `${0.6 + i * 0.15}s`, opacity: 0 }}
          >
            <p className="text-xs text-[var(--accent)] font-bold mb-1">
              {book.order}冊目：{book.title}
            </p>
            <p className="text-sm text-[var(--text-light)] leading-relaxed">
              {book.reason}
            </p>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <button
          onClick={onReset}
          className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm
                     hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors
                     font-[family-name:var(--font-serif)]"
        >
          別の悩みで選んでもらう
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-[#1d1d1b] text-white rounded-xl text-sm text-center
                     hover:bg-[#333] transition-colors font-[family-name:var(--font-serif)]"
        >
          𝕏 でシェア
        </a>
      </div>

      {/* フッター */}
      <footer className="text-center text-xs text-[var(--text-light)] pt-6 border-t border-[var(--border)]">
        <p>
          書誌データ:{' '}
          <a
            href="https://ndlsearch.ndl.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--accent)]"
          >
            国立国会図書館サーチ
          </a>
        </p>
        <p className="mt-1">※AIによる選書です。書店・図書館でお確かめください</p>
      </footer>
    </div>
  );
}
