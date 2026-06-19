import type { Metadata } from 'next';
import Link from 'next/link';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { getRecentLotteryResults } from '@/lib/lottery/provider';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'XSMB 30 ngày - Sổ kết quả xổ số miền Bắc',
  description: 'Sổ kết quả XSMB 30 ngày gần nhất, hỗ trợ tra cứu nhanh kết quả xổ số miền Bắc theo từng ngày.',
  alternates: { canonical: absoluteUrl('/xsmb-30-ngay') }
};

export default async function XsmbThirtyDaysPage() {
  const recent = await getRecentLotteryResults('xsmb');

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="contentPanel">
        <h1>XSMB 30 ngày - sổ kết quả xổ số miền Bắc</h1>
        <p className="panelLead">
          Tra cứu kết quả xổ số miền Bắc các ngày gần đây, xem nhanh giải đặc biệt và mở chi tiết từng ngày khi cần đối chiếu.
        </p>
      </section>

      {recent.length ? <RecentResults results={recent} title="Danh sách kết quả XSMB gần đây" /> : <DataUnavailable title="Chưa có sổ kết quả 30 ngày" />}

      {recent.map((result) => (
        <section className="compactResult" key={result.date}>
          <ResultBoard result={result} headingLevel={2} />
        </section>
      ))}

      <section className="contentPanel seoText">
        <h2>Cách tra cứu XSMB 30 ngày</h2>
        <p>
          Chọn ngày trong danh sách để xem bảng kết quả đầy đủ. Mỗi trang ngày có địa chỉ riêng như{' '}
          <Link href="/xsmb/2026-06-19">/xsmb/2026-06-19</Link>, giúp người dùng dễ lưu lại và tra cứu khi cần.
        </p>
      </section>

      <DisclaimerBox />
    </LotteryShell>
  );
}
