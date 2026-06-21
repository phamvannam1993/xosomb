import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getLotterySource } from '@/lib/lottery/catalog';
import { createLivePlaceholderResult, getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import { getLatestLotteryResult, getRecentLotteryResults } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ code: string }> };

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

function provinceName(name: string) {
  return name.replace(/^Xổ số\s+/i, '');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const source = getLotterySource(code);
  if (!source) return { title: 'Không tìm thấy đài xổ số', robots: { index: false, follow: true } };

  const canonical = absoluteUrl(`/${source.code}`);
  const displayName = provinceName(source.name);
  const isRegion = source.code === 'xsmn' || source.code === 'xsmt';

  return {
    title: `${source.shortName} hôm nay - Kết quả ${displayName}`,
    description: isRegion
      ? `Xem ${source.shortName} hôm nay, kết quả xổ số ${displayName} mới nhất theo từng tỉnh, cập nhật đầy đủ các giải và bảng lô tô.`
      : `Xem ${source.shortName} hôm nay, kết quả xổ số ${displayName} mới nhất, đầy đủ giải đặc biệt, các giải trong ngày và lô tô đầu đuôi.`,
    alternates: { canonical }
  };
}

export default async function LotteryCodePage({ params }: PageProps) {
  const { code } = await params;
  const source = getLotterySource(code);
  if (!source) notFound();
  const resolvedSource = source!;
  if (code.toLowerCase() !== resolvedSource.code) redirect(`/${resolvedSource.code}`);

  const result = await getLatestLotteryResult(resolvedSource.code);
  const recent = await getRecentLotteryResults(resolvedSource.code);
  const liveWindow = getLiveDrawWindow(resolvedSource);
  const liveOptions = liveWindow.shouldPoll
    ? {
        code: resolvedSource.code,
        shortName: resolvedSource.shortName,
        scheme: resolvedSource.scheme,
        liveWindow,
        initialResult: result?.date === liveWindow.date ? toLiveLotteryResult(result) : null
      }
    : null;
  const boardResult = result || (liveOptions ? createLivePlaceholderResult(resolvedSource, liveWindow.date) : null);
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: resolvedSource.shortName, path: `/${resolvedSource.code}` }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
        <section className="searchPanel">
          <div className="date-picker-title">Chọn ngày xem {resolvedSource.shortName}</div>
          <DateSearchForm defaultDate={liveOptions?.liveWindow.date || boardResult?.date} code={resolvedSource.code} />
        </section>
        {boardResult ? (
          <>
            <ResultBoard result={boardResult} live={liveOptions} />
            {recent.length ? <RecentResults results={recent} /> : null}
          </>
        ) : (
          <DataUnavailable
            title={`Chưa có dữ liệu ${resolvedSource.shortName}`}
            message="Kết quả cho đài này chưa sẵn sàng. Vui lòng thử lại sau hoặc chọn một ngày khác để tra cứu."
          />
        )}
        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
