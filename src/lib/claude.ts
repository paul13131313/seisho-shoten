import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeBook {
  order: number;
  title: string;
  author: string;
  isbn: string | null;
  reason: string;
  role: string;
}

export interface ClaudeResponse {
  storyline: string;
  books: ClaudeBook[];
}

const SYSTEM_PROMPT = `あなたは「生成書店」の選書AIです。
ユーザーの悩み・状況・興味に対して、最適な3冊の本を選びます。

ルール:
- 実在する日本語の書籍のみ選ぶ（翻訳書OK）
- 3冊には「読む順番」の意味を持たせる（1冊目→2冊目→3冊目でストーリーになる）
- 新しめの本（2015年以降）を優先するが、名著なら古くてもOK
- ベストセラーに偏らず、意外性のある1冊を混ぜる
- 同じ著者から2冊以上選ばない

出力はJSON形式のみ。マークダウンのコードブロックで囲まない。
{
  "storyline": "3冊を通して読むことで得られる体験を2〜3文で。なぜこの順番なのかを含める",
  "books": [
    {
      "order": 1,
      "title": "書籍タイトル",
      "author": "著者名",
      "isbn": "ISBN-13（分かる場合）またはnull",
      "reason": "この本を選んだ理由。1〜2文",
      "role": "この本がストーリーの中で果たす役割。5〜10文字（例:「まず自分を知る」）"
    }
  ]
}`;

export async function selectBooks(query: string): Promise<ClaudeResponse> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude APIからテキスト応答がありませんでした');
  }

  // マークダウンのコードブロックで囲まれている場合を除去
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: ClaudeResponse;
  try {
    parsed = JSON.parse(jsonText) as ClaudeResponse;
  } catch {
    throw new Error('選書結果の解析に失敗しました。もう一度お試しください');
  }

  if (!parsed.storyline || !parsed.books || parsed.books.length !== 3) {
    throw new Error('選書結果の形式が不正です。もう一度お試しください');
  }

  return parsed;
}
