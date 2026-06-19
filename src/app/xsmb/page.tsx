import type { Metadata } from 'next';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { getLatestLotteryResult, getRecentLotteryResults } from '@/lib/lottery/provider';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'XSMB hôm nay - Kết quả xổ số miền Bắc mới nhất',
  description: 'Xem kết quả xổ số miền Bắc hôm nay, bảng giải đặc biệt, giải nhất, giải nhì, giải ba và lô tô 2 số cuối.',
  alternates: { canonical: absoluteUrl('/xsmb') }
};

export default async function XsmbTodayPage() {
  const result = await getLatestLotteryResult('xsmb');
  const recent = await getRecentLotteryResults('xsmb');

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="searchPanel">
        <h2>Chọn ngày xem XSMB</h2>
        <DateSearchForm defaultDate={result?.date} code="xsmb" />
      </section>
      {result ? <ResultBoard result={result} /> : <DataUnavailable />}
      {recent.length ? <RecentResults results={recent} /> : null}
      <DisclaimerBox />
    </LotteryShell>
  );
}
