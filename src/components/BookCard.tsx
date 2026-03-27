'use client';

import type { BookResult } from '@/app/api/select-books/route';

interface BookCardProps {
  book: BookResult;
  index: number;
}

function BookCoverPlaceholder({ title, author }: { title: string; author: string }) {
  const displayTitle = title.length > 20 ? title.slice(0, 20) + '…' : title;

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-[#f5f0e8] relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--accent)]" />
      <div className="flex-1 flex items-center justify-center pt-2">
        <p className="text-sm font-bold leading-snug text-center text-[var(--text)] font-[family-name:var(--font-serif)]">
          {displayTitle}
        </p>
      </div>
      <p className="text-[10px] text-center text-[var(--text-light)]">
        {author}
      </p>
    </div>
  );
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
      <div className="w-[140px] h-[200px] sm:w-[160px] sm:h-[230px] rounded-sm book-shadow overflow-hidden flex items-center justify-center mb-3">
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
                parent.style.backgroundColor = '#f5f0e8';
                const displayTitle = book.title.length > 20 ? book.title.slice(0, 20) + '…' : book.title;
                parent.innerHTML = `
                  <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:16px;position:relative">
                    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:#8b2500"></div>
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding-top:8px">
                      <p style="color:#2c2418;font-size:14px;font-weight:bold;text-align:center;line-height:1.4">${displayTitle}</p>
                    </div>
                    <p style="color:#7a6f63;font-size:10px;text-align:center">${book.author}</p>
                  </div>`;
              }
            }}
          />
        ) : (
          <BookCoverPlaceholder title={book.title} author={book.author} />
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
