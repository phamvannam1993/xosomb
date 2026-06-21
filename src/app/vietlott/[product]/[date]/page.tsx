import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LotteryShell } from '@/components/LotteryShell';
import { VietlottBoard } from '@/components/vietlott/VietlottBoard';
import { VietlottTabs } from '@/components/vietlott/VietlottTabs';
import { getVietlottProduct } from '@/lib/vietlott/catalog';
import { dateTextForSeo, isFutureDate, isYyyyMmDd } from '@/lib/vietlott/format';
import { getVietlottResult } from '@/lib/vietlott/provider';
import { absoluteUrl } from '@/lib/site';

type PageProps = { params: Promise<{ product: string; date: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product: productParam, date } = await params;
  const product = getVietlottProduct(productParam);
  if (!product || !isYyyyMmDd(date) || isFutureDate(date)) return { title: 'Không tìm thấy kết quả Vietlott', robots: { index: false, follow: false } };

  const result = await getVietlottResult(product.id, date);

  const dateLabel = dateTextForSeo(date);

  return {
    title: `${product.shortName} ${dateLabel} - Kết quả ${product.name}`,
    description: `Tra cứu kết quả ${product.shortName} ${dateLabel}, dãy số trúng thưởng và thống kê giải.`,
    alternates: { canonical: absoluteUrl(`/vietlott/${product.id}/${date}`) },
    robots: result ? { index: true, follow: true } : { index: false, follow: true }
  };
}

export default async function VietlottDatePage({ params }: PageProps) {
  const { product: productParam, date } = await params;
  const product = getVietlottProduct(productParam);
  if (!product || !isYyyyMmDd(date) || isFutureDate(date)) notFound();
  const resolvedProduct = product!;

  const result = await getVietlottResult(resolvedProduct.id, date);
  if (!result) notFound();

  return (
    <LotteryShell>
      <VietlottTabs active={resolvedProduct.id} />
      <VietlottBoard result={result!} />
    </LotteryShell>
  );
}
