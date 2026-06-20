import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { LotteryShell } from '@/components/LotteryShell';
import { VietlottBoard } from '@/components/vietlott/VietlottBoard';
import { VietlottRecentResults } from '@/components/vietlott/VietlottRecentResults';
import { VietlottTabs } from '@/components/vietlott/VietlottTabs';
import { getVietlottProduct } from '@/lib/vietlott/catalog';
import { getLatestVietlottResult, getRecentVietlottResults } from '@/lib/vietlott/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ product: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product: productParam } = await params;
  const product = getVietlottProduct(productParam);
  if (!product) return { title: 'Không tìm thấy sản phẩm Vietlott', robots: { index: false, follow: true } };

  return {
    title: `${product.shortName} hôm nay - Kết quả ${product.name}`,
    description: product.description,
    alternates: { canonical: absoluteUrl(`/vietlott/${product.id}`) }
  };
}

export default async function VietlottProductPage({ params }: PageProps) {
  const { product: productParam } = await params;
  const product = getVietlottProduct(productParam);
  if (!product) notFound();

  const result = await getLatestVietlottResult(product.id);
  const recent = await getRecentVietlottResults(product.id, 30);

  return (
    <LotteryShell>
      <VietlottTabs active={product.id} />
      <section className="searchPanel">
        <div className="date-picker-title">Chọn ngày xem {product.shortName}</div>
        <DateSearchForm defaultDate={result?.date} code={`vietlott/${product.id}`} />
        <p className="mutedText">{product.schedule}</p>
      </section>

      {result ? (
        <VietlottBoard result={result} />
      ) : (
        <DataUnavailable title={`Chưa có dữ liệu ${product.shortName}`} message="Kết quả sản phẩm này chưa sẵn sàng. Vui lòng thử lại sau hoặc chọn một ngày khác." />
      )}

      <VietlottRecentResults results={recent} />
    </LotteryShell>
  );
}
