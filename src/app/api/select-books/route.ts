import { NextRequest } from 'next/server';
import { selectBooks } from '@/lib/claude';
import { enrichBook } from '@/lib/ndl';
import { INPUT_MIN_LENGTH, INPUT_MAX_LENGTH } from '@/lib/constants';

export const maxDuration = 30; // Vercel function timeout

export interface BookResult {
  order: number;
  title: string;
  author: string;
  isbn: string | null;
  reason: string;
  role: string;
  thumbnail: string | null;
  publisher: string | null;
  ndc: string | null;
  publishedYear: number | null;
  ndlLink: string | null;
}

export interface SelectBooksResponse {
  query: string;
  storyline: string;
  books: BookResult[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query?.trim();

    if (!query || query.length < INPUT_MIN_LENGTH) {
      return Response.json(
        { error: 'もう少し詳しく教えてください（5文字以上）' },
        { status: 400 },
      );
    }

    if (query.length > INPUT_MAX_LENGTH) {
      return Response.json(
        { error: `${INPUT_MAX_LENGTH}文字以内で入力してください` },
        { status: 400 },
      );
    }

    // Step 1: Claude APIで選書
    const claudeResult = await selectBooks(query);

    // Step 2: NDL APIで書誌データ補完（並列処理）
    const enrichedBooks = await Promise.all(
      claudeResult.books.map(async (book) => {
        const ndlData = await enrichBook(book.title, book.author, book.isbn);

        return {
          order: book.order,
          title: book.title,
          author: book.author,
          isbn: ndlData?.isbn ?? book.isbn,
          reason: book.reason,
          role: book.role,
          thumbnail: ndlData?.thumbnailUrl ?? null,
          publisher: ndlData?.publisher ?? null,
          ndc: ndlData?.ndc ?? null,
          publishedYear: ndlData?.publishedYear ?? null,
          ndlLink: ndlData?.ndlLink ?? null,
        } satisfies BookResult;
      }),
    );

    const response: SelectBooksResponse = {
      query,
      storyline: claudeResult.storyline,
      books: enrichedBooks,
    };

    return Response.json(response);
  } catch (error) {
    console.error('select-books error:', error);

    const message =
      error instanceof Error ? error.message : '選書中にエラーが発生しました';

    return Response.json({ error: message }, { status: 500 });
  }
}
