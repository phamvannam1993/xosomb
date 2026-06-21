import type { Metadata } from 'next';
import Link from 'next/link';
import { LotteryShell } from '@/components/LotteryShell';
import { DataUnavailable } from '@/components/DataUnavailable';
import { VietlottBoard } from '@/components/vietlott/VietlottBoard';
import { VietlottTabs } from '@/components/vietlott/VietlottTabs';
import { getAllVietlottProducts } from '@/lib/vietlott/catalog';
import { getLatestVietlottResult } from '@/lib/vietlott/provider';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Kết quả Vietlott hôm nay - Mega 6/45, Power 6/55, Max 3D',
  description: 'Tra cứu kết quả Vietlott mới nhất: Mega 6/45, Power 6/55, Max 3D và Max 3D Pro.',
  alternates: { canonical: absoluteUrl('/vietlott') }
};

export default async function VietlottPage() {
  const products = getAllVietlottProducts();
  const results = await Promise.all(products.map((product) => getLatestVietlottResult(product.id)));

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Vietlott', path: '/vietlott' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <VietlottTabs />
      <section className="introCard">
        <h1>Kết quả Vietlott hôm nay</h1>
        <p>Tra cứu nhanh kết quả các sản phẩm Vietlott phổ biến: Mega 6/45, Power 6/55, Max 3D và Max 3D Pro.</p>
      </section>

      <section className="quickGrid">
        {products.map((product) => (
          <Link href={`/vietlott/${product.id}`} className="quickCard" key={product.id}>
            <strong>{product.shortName}</strong>
            <span>{product.description}</span>
          </Link>
        ))}
      </section>

      {results.filter(Boolean).length ? (
        results.map((result) => result ? <VietlottBoard result={result} headingLevel={2} key={result.product} /> : null)
      ) : (
        <DataUnavailable title="Chưa có dữ liệu Vietlott" message="Kết quả Vietlott chưa sẵn sàng. Vui lòng thử lại sau." headingLevel={2} />
      )}
      </LotteryShell>
    </>
  );
}
