'use client';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      {/* 本のアニメーション */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-8 h-12 bg-[var(--accent)] rounded-sm animate-page-flip"
            style={{
              animationDelay: `${i * 0.3}s`,
              opacity: 0.6 + i * 0.15,
            }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-lg font-[family-name:var(--font-serif)] text-[var(--text)]">
          📚 選書中...
        </p>
        <p className="text-sm text-[var(--text-light)] mt-2">
          あなたの3冊を探しています
        </p>
      </div>
    </div>
  );
}
