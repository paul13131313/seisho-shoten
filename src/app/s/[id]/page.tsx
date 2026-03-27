import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SharePageClient from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSelection(id: string) {
  const { data } = await supabase
    .from('selections')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const selection = await getSelection(id);

  if (!selection) {
    return { title: '生成書店' };
  }

  const books = selection.books as { title: string; author: string }[];
  const bookTitles = books.map((b, i) => `${i + 1}. ${b.title}`).join(' / ');
  const description = `「${selection.query}」に対するAI選書：${bookTitles}`;

  return {
    title: `「${selection.query}」のための3冊 — 生成書店`,
    description,
    openGraph: {
      title: `「${selection.query}」のための3冊`,
      description,
      images: [`/api/og/${id}`],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const selection = await getSelection(id);

  if (!selection) {
    notFound();
  }

  return (
    <SharePageClient
      id={id}
      query={selection.query}
      storyline={selection.storyline}
      books={selection.books}
    />
  );
}
