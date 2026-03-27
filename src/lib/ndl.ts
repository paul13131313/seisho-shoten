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
 */
export async function searchNDL(
  title: string,
  author?: string,
): Promise<NDLBook | null> {
  const params = new URLSearchParams({ cnt: '3' });
  if (title) params.set('title', title);
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
 */
export async function enrichBook(
  title: string,
  author: string,
  isbn: string | null,
): Promise<NDLBook | null> {
  // 1. ISBNがある場合、まずISBN検索
  if (isbn) {
    const byIsbn = await searchNDLByISBN(isbn);
    if (byIsbn) return byIsbn;
  }

  // 2. タイトル+著者で検索
  const byTitle = await searchNDL(title, author);
  if (byTitle) return byTitle;

  // 3. タイトルのみで検索
  const byTitleOnly = await searchNDL(title);
  if (byTitleOnly) return byTitleOnly;

  return null;
}
