import type { Metadata } from 'next';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { digitStats } from '@/lib/lottery/format';
import { getRecentLotteryResults } from '@/lib/lottery/provider';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const metadata: Metadata = {
  title: 'Thống kê XSMB tham khảo',
  description: 'Thống kê tần suất 2 số cuối từ dữ liệu kết quả xổ số miền Bắc gần đây. Chỉ dùng để tham khảo dữ liệu.',
  alternates: { canonical: absoluteUrl('/thong-ke') }
};

export default async function StatsPage() {
  const recent = await getRecentLotteryResults('xsmb');
  const topStats = digitStats(recent).slice(0, 30);

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Thống kê', path: '/thong-ke' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
      <section className="contentPanel">
        <h1>Thống kê XSMB tham khảo</h1>
        <p className="panelLead">
          Bảng thống kê tần suất 2 số cuối từ các kết quả gần đây. Nội dung chỉ phục vụ tham khảo dữ liệu, không phải gợi ý dự đoán.
        </p>
      </section>

      <section className="statsList">
        {topStats.map((item) => (
          <div className="statDigit" key={item.digit}>
            <strong>{item.digit}</strong>
            <span>{item.count} lần</span>
          </div>
        ))}
      </section>

      <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
