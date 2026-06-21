import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getLotterySource } from '@/lib/lottery/catalog';
import { dateTextForSeo, ddMmYyyyFromDate, isFutureDate, isYyyyMmDd } from '@/lib/lottery/format';
import { createLivePlaceholderResult, getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import { getLotteryResult } from '@/lib/lottery/provider';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const revalidate = 60;

type PageProps = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  if (!isYyyyMmDd(date) || isFutureDate(date)) return { title: 'Không tìm thấy dữ liệu', robots: { index: false, follow: false } };

  const result = await getLotteryResult('xsmb', date).catch(() => null);
  const canonical = absoluteUrl(`/xsmb/${date}`);
  const dateLabel = dateTextForSeo(date);

  if (!result) {
    return {
      title: `Chưa có dữ liệu XSMB ${dateLabel} - Kết quả xổ số miền Bắc`,
      description: `Trang tra cứu kết quả xổ số miền Bắc ${dateLabel}. Kết quả ngày này hiện chưa sẵn sàng để hiển thị.`,
      robots: { index: false, follow: true },
      alternates: { canonical }
    };
  }

  return {
    title: `XSMB ${dateLabel} - Kết quả xổ số miền Bắc`,
    description: `Tra cứu kết quả xổ số miền Bắc ${dateLabel}: giải đặc biệt, các giải đầy đủ và bảng lô tô 2 số cuối.`,
    alternates: { canonical }
  };
}

export default async function XsmbByDatePage({ params }: PageProps) {
  const { date } = await params;
  if (!isYyyyMmDd(date) || isFutureDate(date)) notFound();
  const xsmbSource = getLotterySource('xsmb')!;
  const result = await getLotteryResult('xsmb', date);
  const liveWindow = getLiveDrawWindow(xsmbSource);
  const liveOptions = liveWindow.shouldPoll && date === liveWindow.date
    ? {
        code: xsmbSource.code,
        shortName: xsmbSource.shortName,
        scheme: xsmbSource.scheme,
        liveWindow,
        initialResult: result?.date === liveWindow.date ? toLiveLotteryResult(result) : null
      }
    : null;
  const boardResult = result || (liveOptions ? createLivePlaceholderResult(xsmbSource, liveWindow.date) : null);
  if (!boardResult) notFound();

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'XSMB', path: '/xsmb' },
    { name: `Ngày ${ddMmYyyyFromDate(date)}`, path: `/xsmb/${date}` }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
      <section className="searchPanel">
        <div className="date-picker-title">Tra cứu XSMB theo ngày</div>
        <DateSearchForm defaultDate={date} code="xsmb" />
      </section>
      <ResultBoard result={boardResult!} live={liveOptions} />
      <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
