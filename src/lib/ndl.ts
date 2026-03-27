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
 * NDL OpenSearchでタイトル+著者検索
 * ※NDLのtitleパラメータは長いタイトルだとヒットしないため、
 *   先頭15文字に切り詰めて部分一致検索する
 */
export async function searchNDL(
  title: string,
  author?: string,
): Promise<NDLBook | null> {
  // タイトルを短くして検索精度を上げる（NDLは長いタイトルだとヒットしない）
  const shortTitle = title.length > 15 ? title.slice(0, 15) : title;

  const params = new URLSearchParams({ cnt: '5' });
  if (shortTitle) params.set('title', shortTitle);
  if (author) params.set('creator', author);

  const url = `${NDL_API_BASE}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/xml' } });

  if (!res.ok) return null;

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;

  if (!items || items.length === 0) return null;

  const item = items[0];

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
 * 複数の検索戦略でフォールバック
 */
export async function enrichBook(
  title: string,
  author: string,
  isbn: string | null,
): Promise<NDLBook | null> {
  // 1. タイトル全文で検索（著者なし — 著者名の表記揺れを避ける）
  const byTitle = await searchNDL(title);
  if (byTitle) return byTitle;

  // 2. タイトル+著者の姓（最初の空白/カンマ前）で検索
  const surname = extractSurname(author);
  if (surname) {
    const byTitleAuthor = await searchNDL(title, surname);
    if (byTitleAuthor) return byTitleAuthor;
  }

  // 3. ISBNがある場合（Claudeの出力が正しい可能性もある）
  if (isbn) {
    const byIsbn = await searchNDLByISBN(isbn);
    if (byIsbn) return byIsbn;
  }

  // 4. タイトルの主要部分のみで検索（サブタイトル除去）
  const mainTitle = title.split(/[：:—–\-\/]/).at(0)?.trim();
  if (mainTitle && mainTitle !== title) {
    const byMainTitle = await searchNDL(mainTitle);
    if (byMainTitle) return byMainTitle;
  }

  return null;
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
