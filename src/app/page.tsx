import type { Metadata } from 'next';
import Link from 'next/link';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getLotterySource } from '@/lib/lottery/catalog';
import { createLivePlaceholderResult, getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import { getLatestLotteryResult, getRecentLotteryResults } from '@/lib/lottery/provider';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'XSMB hôm nay - Kết quả xổ số miền Bắc mới nhất',
  description: 'Xem XSMB hôm nay với bảng kết quả xổ số miền Bắc đầy đủ, giải đặc biệt, các giải trong ngày và lô tô 2 số cuối.',
  alternates: { canonical: absoluteUrl('/') }
};

export default async function HomePage() {
  const latest = await getLatestLotteryResult('xsmb');
  const recent = await getRecentLotteryResults('xsmb');
  const xsmbSource = getLotterySource('xsmb')!;
  const liveWindow = getLiveDrawWindow(xsmbSource);
  const liveOptions = {
    code: xsmbSource.code,
    shortName: xsmbSource.shortName,
    scheme: xsmbSource.scheme,
    liveWindow,
    initialResult: latest?.date === liveWindow.date ? toLiveLotteryResult(latest) : null
  };
  const boardResult = latest || (liveWindow.shouldPoll ? createLivePlaceholderResult(xsmbSource, liveWindow.date) : null);

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />

      <section className="searchPanel">
        <div className="date-picker-title">Tra cứu kết quả xổ số theo ngày</div>
        <DateSearchForm defaultDate={liveWindow.shouldPoll ? liveWindow.date : boardResult?.date} code="xsmb" />
      </section>

      {boardResult ? <ResultBoard result={boardResult} live={liveOptions} /> : <DataUnavailable />}

      {recent.length ? <RecentResults results={recent} title="XSMB các ngày gần đây" /> : null}

      <section className="contentPanel seoText">
        <h2>XSMB hôm nay - kết quả xổ số miền Bắc mới nhất</h2>
        <p>
          XoSoMB.vn giúp tra cứu kết quả xổ số miền Bắc theo từng ngày, hiển thị đầy đủ giải đặc biệt, giải nhất,
          giải nhì, giải ba, giải tư, giải năm, giải sáu, giải bảy và bảng lô tô đầu - đuôi 2 số cuối.
        </p>
        <p>
          Người dùng có thể xem <Link href="/xsmb">XSMB hôm nay</Link>, mở <Link href="/xsmb-30-ngay">sổ kết quả 30 ngày</Link>,
          hoặc theo dõi <Link href="/lich-mo-thuong">lịch mở thưởng</Link> để tra cứu nhanh hơn.
        </p>
      </section>

      <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
