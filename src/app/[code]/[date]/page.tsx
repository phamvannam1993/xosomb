import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getLotterySource } from '@/lib/lottery/catalog';
import { dateTextForSeo, ddMmYyyyFromDate, isFutureDate, isYyyyMmDd } from '@/lib/lottery/format';
import { createLivePlaceholderResult, getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import { getLotteryResult } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ code: string; date: string }> };

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

function provinceName(name: string) {
  return name.replace(/^Xổ số\s+/i, '');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date) || isFutureDate(date)) return { title: 'Không tìm thấy dữ liệu', robots: { index: false, follow: false } };

  const result = await getLotteryResult(source.code, date).catch(() => null);
  const canonical = absoluteUrl(`/${source.code}/${date}`);
  const dateLabel = dateTextForSeo(date);
  const displayName = provinceName(source.name);

  if (!result) {
    return {
      title: `Chưa có dữ liệu ${source.shortName} ${dateLabel}`,
      description: `Trang tra cứu ${source.shortName} ${dateLabel}. Kết quả ngày này hiện chưa sẵn sàng để hiển thị.`,
      robots: { index: false, follow: true },
      alternates: { canonical }
    };
  }

  return {
    title: `${source.shortName} ${dateLabel} - Kết quả ${displayName}`,
    description: `Tra cứu ${source.shortName} ${dateLabel}: kết quả xổ số ${displayName}, đầy đủ các giải và bảng lô tô đầu đuôi 2 số cuối.`,
    alternates: { canonical }
  };
}

export default async function LotteryCodeDatePage({ params }: PageProps) {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date) || isFutureDate(date)) notFound();
  const resolvedSource = source!;
  if (code.toLowerCase() !== resolvedSource.code) redirect(`/${resolvedSource.code}/${date}`);

  const result = await getLotteryResult(resolvedSource.code, date);
  const liveWindow = getLiveDrawWindow(resolvedSource);
  const liveOptions = date === liveWindow.date
    ? {
        code: resolvedSource.code,
        shortName: resolvedSource.shortName,
        scheme: resolvedSource.scheme,
        liveWindow,
        initialResult: result?.date === liveWindow.date ? toLiveLotteryResult(result) : null
      }
    : null;
  const boardResult = result || (liveWindow.shouldPoll && liveOptions ? createLivePlaceholderResult(resolvedSource, liveWindow.date) : null);
  if (!boardResult) notFound();

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: resolvedSource.shortName, path: `/${resolvedSource.code}` },
    { name: `Ngày ${ddMmYyyyFromDate(date)}`, path: `/${resolvedSource.code}/${date}` }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
        <section className="searchPanel">
          <div className="date-picker-title">Tra cứu {resolvedSource.shortName} theo ngày</div>
          <DateSearchForm defaultDate={date} code={resolvedSource.code} />
        </section>
        <ResultBoard result={boardResult!} live={liveOptions} />
        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
