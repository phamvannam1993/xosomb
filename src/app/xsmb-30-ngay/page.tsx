import type { Metadata } from 'next';
import Link from 'next/link';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getRecentLotteryResults } from '@/lib/lottery/provider';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'XSMB 30 ngày - Sổ kết quả xổ số miền Bắc',
  description: 'Sổ kết quả XSMB 30 ngày gần nhất, hỗ trợ tra cứu nhanh kết quả xổ số miền Bắc theo từng ngày.',
  alternates: { canonical: absoluteUrl('/xsmb-30-ngay') }
};

export default async function XsmbThirtyDaysPage() {
  const recent = await getRecentLotteryResults('xsmb');
  const latest = recent[0] || null;
  const sampleResult = recent[1] || latest;

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'XSMB', path: '/xsmb' },
    { name: 'XSMB 30 ngày', path: '/xsmb-30-ngay' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
      <section className="contentPanel">
        <h1>XSMB 30 ngày - sổ kết quả xổ số miền Bắc</h1>
        <p className="panelLead">
          Tra cứu kết quả xổ số miền Bắc các ngày gần đây. Chọn ngày trong danh sách để xem bảng chi tiết đầy đủ.
        </p>
      </section>

      {/* Danh sách link các ngày (không render 30 bảng) */}
      {recent.length ? <RecentResults results={recent} title="Danh sách kết quả XSMB gần đây" /> : <DataUnavailable title="Chưa có sổ kết quả 30 ngày" />}

      {/* Chỉ show bảng chi tiết cho ngày mới nhất */}
      {latest && (
        <section className="compactResult">
          <ResultBoard result={latest} headingLevel={2} />
        </section>
      )}

      <section className="contentPanel seoText">
        <h2>Cách sử dụng sổ kết quả 30 ngày</h2>
        <p>
          Danh sách trên hiển thị các kết quả gần nhất. Bảng chi tiết dưới đây là kết quả mới nhất để đối chiếu nhanh.{' '}
          <strong>Nhấp vào bất kỳ ngày nào trong danh sách</strong> để xem bảng kết quả đầy đủ cho ngày đó
          {sampleResult ? (
            <>
              {' '}
              (ví dụ: <Link href={`/xsmb/${sampleResult.date}`}>kết quả ngày {sampleResult.date.split('-').reverse().join('/')}</Link>).
            </>
          ) : null}
        </p>
        <p>
          Mỗi ngày có một trang riêng với đường dẫn cố định, giúp bạn dễ dàng lưu và chia sẻ kết quả.
        </p>
      </section>

      <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
