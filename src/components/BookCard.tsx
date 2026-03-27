'use client';

import type { BookResult } from '@/app/api/select-books/route';

interface BookCardProps {
  book: BookResult;
  index: number;
}

export default function BookCard({ book, index }: BookCardProps) {
  return (
    <div
      className="flex flex-col items-center animate-fade-in-up"
      style={{ animationDelay: `${index * 0.2}s`, opacity: 0 }}
    >
      {/* 順番ラベル */}
      <p className="text-xs text-[var(--text-light)] mb-2 font-[family-name:var(--font-serif)]">
        {book.order}冊目
      </p>

      {/* 書影 */}
      <div className="w-[140px] h-[200px] sm:w-[160px] sm:h-[230px] bg-[#e8e2d9] rounded-sm book-shadow overflow-hidden flex items-center justify-center mb-3">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="flex flex-col items-center justify-center h-full px-3 text-center">
                  <span class="text-3xl mb-2">📖</span>
                  <span class="text-xs text-[#7a6f63] leading-tight">${book.title.slice(0, 20)}</span>
                </div>`;
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-3 text-center">
            <span className="text-3xl mb-2">📖</span>
            <span className="text-xs text-[var(--text-light)] leading-tight">
              {book.title.length > 20 ? book.title.slice(0, 20) + '…' : book.title}
            </span>
          </div>
        )}
      </div>

      {/* 役割ラベル */}
      <p className="text-sm font-bold text-[var(--accent)] font-[family-name:var(--font-serif)] mb-2">
        「{book.role}」
      </p>

      {/* タイトル・著者 */}
      <h3 className="text-sm font-bold text-center leading-snug max-w-[180px] mb-1">
        {book.title}
      </h3>
      <p className="text-xs text-[var(--text-light)] text-center">
        {book.author}
      </p>
      {book.publisher && (
        <p className="text-[10px] text-[var(--text-light)] text-center mt-0.5">
          {book.publisher}{book.publishedYear ? ` (${book.publishedYear})` : ''}
        </p>
      )}

      {/* Amazonで探すボタン */}
      <a
        href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-[10px] px-3 py-1 border border-[var(--border)] rounded-full
                   text-[var(--text-light)] hover:border-[#ff9900] hover:text-[#ff9900] transition-colors"
      >
        Amazonで探す →
      </a>
    </div>
  );
}
