// 例文リスト（ランダムに3つ表示）
export const EXAMPLE_QUERIES = [
  '転職したいけど踏み出せない',
  '子育てが始まった',
  'AIに仕事を奪われそう',
  '眠れない夜に読む本がほしい',
  '彼女にフラれた',
  '死ぬまでに読むべき本',
  '新しい趣味を見つけたい',
  'お金の不安をなんとかしたい',
  '人間関係に疲れた',
  '30歳になって何も成し遂げていない',
  '起業したいけど何から始めれば',
  '読書習慣をつけたい',
  '海外で暮らしてみたい',
  '自分に自信が持てない',
  'もっと文章がうまくなりたい',
] as const;

// 入力バリデーション
export const INPUT_MIN_LENGTH = 5;
export const INPUT_MAX_LENGTH = 200;

// NDL API
export const NDL_API_BASE = 'https://ndlsearch.ndl.go.jp/api/opensearch';
export const NDL_THUMBNAIL_BASE = 'https://ndlsearch.ndl.go.jp/thumbnail';
