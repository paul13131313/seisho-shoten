import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_JP({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "生成書店 — あなたの悩みに、3冊。",
  description:
    "どんな悩みにも3冊で答えるAI選書サービス。国立国会図書館の書誌データ×AIで、あなただけの3冊を書影付きの棚として表示します。",
  openGraph: {
    title: "生成書店 — あなたの悩みに、3冊。",
    description: "どんな悩みにも3冊で答えるAI選書サービス",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.png" },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf8f5] text-[#2c2418] font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
