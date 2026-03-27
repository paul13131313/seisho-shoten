import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const { data: selection } = await supabase
    .from('selections')
    .select('query, books')
    .eq('id', id)
    .single();

  if (!selection) {
    return new Response('Not found', { status: 404 });
  }

  const books = selection.books as {
    title: string;
    author: string;
    thumbnail: string | null;
    role: string;
  }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf8f5',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        {/* 上部アクセント */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: '#8b2500',
          }}
        />

        {/* タイトル */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <p style={{ fontSize: '18px', color: '#7a6f63', margin: 0 }}>
            「{selection.query}」
          </p>
          <p
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#2c2418',
              margin: '8px 0 0 0',
            }}
          >
            あなたのための3冊
          </p>
        </div>

        {/* 3冊のカード */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'flex-start',
          }}
        >
          {books.map((book, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '280px',
              }}
            >
              {/* 書影 or プレースホルダー */}
              <div
                style={{
                  width: '160px',
                  height: '220px',
                  backgroundColor: '#f5f0e8',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px',
                  boxShadow: '3px 3px 10px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#8b2500',
                  }}
                />
                {book.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.thumbnail}
                    alt=""
                    width={140}
                    height={200}
                    style={{ objectFit: 'contain', width: '140px', height: '200px' }}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#2c2418',
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {book.title.length > 14
                      ? book.title.slice(0, 14) + '…'
                      : book.title}
                  </p>
                )}
              </div>

              {/* 役割 */}
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8b2500',
                  marginTop: '12px',
                }}
              >
                「{book.role}」
              </p>

              {/* タイトル */}
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2c2418',
                  textAlign: 'center',
                  marginTop: '4px',
                  lineHeight: 1.3,
                }}
              >
                {book.title.length > 20
                  ? book.title.slice(0, 20) + '…'
                  : book.title}
              </p>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <p style={{ fontSize: '20px', color: '#2c2418', fontWeight: 'bold' }}>
            📚 生成書店
          </p>
          <p style={{ fontSize: '14px', color: '#7a6f63' }}>
            — あなたの悩みに、3冊。
          </p>
        </div>

        {/* 下部アクセント */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#8b2500',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
