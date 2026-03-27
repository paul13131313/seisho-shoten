'use client';

import type { BookResult } from '@/app/api/select-books/route';

interface BookCardProps {
  book: BookResult;
  index: number;
}

// 本ごとに異なるアクセントカラー
const BOOK_COLORS = [
  { bg: '#2c3e50', accent: '#e74c3c', text: '#ecf0f1' },  // ダークネイビー+赤
  { bg: '#1a472a', accent: '#c9b037', text: '#ecf0f1' },  // ダークグリーン+金
  { bg: '#4a1942', accent: '#e8d5b7', text: '#ecf0f1' },  // ダークパープル+クリーム
];

function BookCoverPlaceholder({ title, author, index }: { title: string; author: string; index: number }) {
  const colors = BOOK_COLORS[index % BOOK_COLORS.length];
  // タイトルを短く表示（改行用に分割）
  const displayTitle = title.length > 16 ? title.slice(0, 16) : title;

  return (
    <div
      className="w-full h-full flex flex-col justify-between p-4 relative overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      {/* 上部の装飾ライン */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: colors.accent }}
      />

      {/* タイトル */}
      <div className="flex-1 flex items-center justify-center pt-4">
        <p
          className="text-sm font-bold leading-snug text-center font-[family-name:var(--font-serif)]"
          style={{ color: colors.text }}
        >
          {displayTitle}
        </p>
      </div>

      {/* 著者名 */}
      <p
        className="text-[10px] text-center opacity-70"
        style={{ color: colors.text }}
      >
        {author}
      </p>

      {/* 下部の装飾ライン */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: colors.accent, opacity: 0.5 }}
      />
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
              // 書影読み込み失敗時はプレースホルダーに切り替え
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const colors = BOOK_COLORS[index % BOOK_COLORS.length];
                parent.style.backgroundColor = colors.bg;
                parent.innerHTML = `
                  <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:16px;position:relative;overflow:hidden">
                    <div style="position:absolute;top:0;left:0;right:0;height:6px;background:${colors.accent}"></div>
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding-top:16px">
                      <p style="color:${colors.text};font-size:14px;font-weight:bold;text-align:center;line-height:1.4">${book.title.slice(0, 16)}</p>
                    </div>
                    <p style="color:${colors.text};opacity:0.7;font-size:10px;text-align:center">${book.author}</p>
                  </div>`;
              }
            }}
          />
        ) : (
          <BookCoverPlaceholder title={book.title} author={book.author} index={index} />
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
