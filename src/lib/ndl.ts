import { XMLParser } from 'fast-xml-parser';
import { NDL_API_BASE, NDL_THUMBNAIL_BASE } from './constants';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  isArray: (name) =>
    ['item', 'dc:subject', 'dc:identifier', 'dc:creator', 'dc:publisher'].includes(name),
});

export interface NDLBook {
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  ndc: string | null;
  publishedYear: number | null;
  thumbnailUrl: string | null;
  ndlLink: string | null;
}

/**
 * ISBNで書影URLを生成
 */
function thumbnailUrl(isbn: string | null): string | null {
  if (!isbn) return null;
  const cleaned = isbn.replace(/-/g, '');
  return `${NDL_THUMBNAIL_BASE}/${cleaned}.jpg`;
}

/**
 * NDL OpenSearchで検索し、最もタイトルが近い結果を返す
 */
export async function searchNDL(
  title: string,
  author?: string,
): Promise<NDLBook | null> {
  // タイトルを短くして検索精度を上げる（NDLは長いタイトルだとヒットしない）
  const shortTitle = title.length > 10 ? title.slice(0, 10) : title;

  const params = new URLSearchParams({ cnt: '10' });
  if (shortTitle) params.set('title', shortTitle);
  if (author) params.set('creator', author);

  const url = `${NDL_API_BASE}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/xml' } });

  if (!res.ok) return null;

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;

  if (!items || items.length === 0) return null;

  // 複数ヒットから最もタイトルが近い（かつISBNがある）ものを選ぶ
  const item = findBestMatch(items, title);

  // ISBN抽出
  const ids = item['dc:identifier'] ?? [];
  let isbn: string | null = null;
  let ndlLink: string | null = null;

  for (const id of Array.isArray(ids) ? ids : [ids]) {
    if (typeof id === 'object') {
      if (id['@_xsi:type'] === 'dcndl:ISBN') isbn = id['#text']?.toString() ?? null;
    }
  }

  // NDLリンク
  ndlLink = item.link?.toString() ?? null;

  // NDC
  const subjects = item['dc:subject'] ?? [];
  let ndc: string | null = null;
  for (const s of Array.isArray(subjects) ? subjects : [subjects]) {
    if (typeof s === 'object' && (s['@_xsi:type'] === 'dcndl:NDC10' || s['@_xsi:type'] === 'dcndl:NDC9')) {
      ndc = s['#text']?.toString() ?? null;
    }
  }

  // 出版年
  const issued = item['dcterms:issued']?.toString() ?? '';
  const yearMatch = issued.match(/^(\d{4})/);
  const publishedYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // 出版社
  const publishers = item['dc:publisher'];
  const publisher = Array.isArray(publishers) ? publishers[0]?.toString() : publishers?.toString() ?? null;

  // 著者
  const creators = item['dc:creator'];
  const authorName = Array.isArray(creators) ? creators[0]?.toString() : creators?.toString() ?? null;

  return {
    title: (Array.isArray(item['dc:title']) ? item['dc:title'][0] : item['dc:title'])?.toString() ?? title,
    author: authorName,
    publisher,
    isbn,
    ndc,
    publishedYear,
    thumbnailUrl: thumbnailUrl(isbn),
    ndlLink,
  };
}

/**
 * ISBNでNDL検索
 */
export async function searchNDLByISBN(isbn: string): Promise<NDLBook | null> {
  const params = new URLSearchParams({ isbn: isbn.replace(/-/g, ''), cnt: '1' });
  const url = `${NDL_API_BASE}?${params.toString()}`;

  const res = await fetch(url, { headers: { Accept: 'application/xml' } });
  if (!res.ok) return null;

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;

  if (!items || items.length === 0) return null;

  const item = items[0];

  const subjects = item['dc:subject'] ?? [];
  let ndc: string | null = null;
  for (const s of Array.isArray(subjects) ? subjects : [subjects]) {
    if (typeof s === 'object' && (s['@_xsi:type'] === 'dcndl:NDC10' || s['@_xsi:type'] === 'dcndl:NDC9')) {
      ndc = s['#text']?.toString() ?? null;
    }
  }

  const issued = item['dcterms:issued']?.toString() ?? '';
  const yearMatch = issued.match(/^(\d{4})/);

  const publishers = item['dc:publisher'];
  const creators = item['dc:creator'];

  return {
    title: (Array.isArray(item['dc:title']) ? item['dc:title'][0] : item['dc:title'])?.toString() ?? '',
    author: Array.isArray(creators) ? creators[0]?.toString() : creators?.toString() ?? null,
    publisher: Array.isArray(publishers) ? publishers[0]?.toString() : publishers?.toString() ?? null,
    isbn: isbn.replace(/-/g, ''),
    ndc,
    publishedYear: yearMatch ? parseInt(yearMatch[1], 10) : null,
    thumbnailUrl: thumbnailUrl(isbn),
    ndlLink: item.link?.toString() ?? null,
  };
}

/**
 * Claude出力の書籍情報をNDLデータで補完
 * 複数の検索戦略を並列実行して高速化
 */
export async function enrichBook(
  title: string,
  author: string,
  isbn: string | null,
): Promise<NDLBook | null> {
  const surname = extractSurname(author);

  // 並列で複数検索を同時実行（高速化）
  const searches: Promise<NDLBook | null>[] = [];

  // 戦略1: タイトル+著者姓
  if (surname) {
    searches.push(searchNDL(title, surname));
  }
  // 戦略2: タイトルのみ
  searches.push(searchNDL(title));

  const results = await Promise.all(searches);

  // ISBNありの結果を優先して返す
  for (const result of results) {
    if (result?.isbn) return result;
  }
  // ISBNなしでもメタデータがあれば返す
  for (const result of results) {
    if (result) return result;
  }

  return null;
}

/**
 * 検索結果から最もタイトルが近い（かつISBN付き優先）アイテムを選ぶ
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBestMatch(items: any[], targetTitle: string): any {
  const normalize = (s: string) =>
    s.replace(/[\s　\u3000]/g, '').replace(/[（）()「」『』【】]/g, '').toLowerCase();

  const target = normalize(targetTitle);

  let bestItem = items[0];
  let bestScore = -1;

  for (const item of items) {
    const itemTitle = normalize(
      (Array.isArray(item['dc:title']) ? item['dc:title'][0] : item['dc:title'])?.toString() ?? '',
    );

    // タイトルの一致度スコア
    let score = 0;

    // 完全一致 or 包含
    if (itemTitle === target) {
      score = 100;
    } else if (itemTitle.includes(target) || target.includes(itemTitle)) {
      score = 80;
    } else {
      // 先頭一致の文字数
      let matchLen = 0;
      for (let i = 0; i < Math.min(itemTitle.length, target.length); i++) {
        if (itemTitle[i] === target[i]) matchLen++;
        else break;
      }
      score = matchLen;
    }

    // ISBNがある方を優先
    const ids = item['dc:identifier'] ?? [];
    const hasIsbn = (Array.isArray(ids) ? ids : [ids]).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (id: any) => typeof id === 'object' && id['@_xsi:type'] === 'dcndl:ISBN',
    );
    if (hasIsbn) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestItem;
}

/**
 * 著者名から姓を抽出（表記揺れ対策）
 */
function extractSurname(author: string): string | null {
  if (!author) return null;
  // 「山田 太郎」→「山田」、「トム・ラス」→「ラス」
  const parts = author.split(/[\s,、・]/);
  // 日本語名なら最初、外国名なら最後
  if (/^[ぁ-んァ-ヶ一-龠]/.test(author)) {
    return parts[0] || null;
  }
  return parts[parts.length - 1] || null;
}
