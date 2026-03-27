'use client';

import { useState, useEffect } from 'react';

const TIPS = [
  '日本では年間約7万点の新刊が出版されています',
  '国立国会図書館には約4,700万点の資料があります',
  '世界最古の印刷物は奈良時代の「百万塔陀羅尼」',
  '「積読」は英語でも "tsundoku" として通じます',
  'フランツ・カフカは生前、ほぼ無名の作家でした',
  '世界一長い小説はマルセル・プルーストの「失われた時を求めて」',
  '紫式部の「源氏物語」は世界最古の長編小説とされています',
  'アイスランドは世界で最も読書量が多い国のひとつ',
  '1冊の本は平均して約6万語で構成されています',
  '村上春樹は毎朝4時に起きて執筆するそうです',
];

const STEPS = [
  { text: 'あなたの悩みを分析しています', icon: '🔍' },
  { text: '11万冊の中から候補を選んでいます', icon: '📚' },
  { text: '3冊のストーリーラインを組み立てています', icon: '✍️' },
  { text: '書影を探しています', icon: '🖼️' },
];

export default function Loading() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 3000);

    return () => {
      clearInterval(tipTimer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-8">
      {/* 本のアニメーション */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-10 h-14 bg-[var(--accent)] rounded-sm animate-page-flip"
            style={{
              animationDelay: `${i * 0.3}s`,
              opacity: 0.5 + i * 0.2,
            }}
          />
        ))}
      </div>

      {/* ステップ表示 */}
      <div className="text-center space-y-3">
        <p className="text-lg font-[family-name:var(--font-serif)] text-[var(--text)]">
          📚 選書中...
        </p>
        <div className="flex flex-col items-center gap-2">
          {STEPS.map((step, i) => (
            <p
              key={i}
              className="text-sm transition-all duration-500"
              style={{
                color: i <= stepIndex ? 'var(--text)' : 'var(--border)',
                fontWeight: i === stepIndex ? 'bold' : 'normal',
              }}
            >
              {i < stepIndex ? '✓' : step.icon} {step.text}
              {i === stepIndex && <span className="animate-pulse">...</span>}
            </p>
          ))}
        </div>
      </div>

      {/* 本にまつわる豆知識 */}
      <div className="max-w-sm text-center border-t border-[var(--border)] pt-6">
        <p className="text-[10px] text-[var(--text-light)] uppercase tracking-widest mb-2">
          📖 本の豆知識
        </p>
        <p
          key={tipIndex}
          className="text-sm text-[var(--text-light)] animate-fade-in-up"
          style={{ opacity: 0 }}
        >
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
