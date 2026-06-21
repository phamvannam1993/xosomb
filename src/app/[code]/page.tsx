import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { RecentResults } from '@/components/RecentResults';
import { ResultBoard } from '@/components/ResultBoard';
import { getLotterySource } from '@/lib/lottery/catalog';
import { getLatestLotteryResult, getRecentLotteryResults } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const source = getLotterySource(code);
  if (!source) return { title: 'Không tìm thấy đài xổ số', robots: { index: false, follow: true } };

  return {
    title: `${source.shortName} hôm nay - Kết quả ${source.name.replace(/^Xổ số\s+/i, '')}`,
    description: `Tra cứu ${source.shortName} hôm nay, bảng kết quả đầy đủ theo giải và lô tô đầu đuôi 2 số cuối.`,
    alternates: { canonical: absoluteUrl(`/${source.code}`) }
  };
}

export default async function LotteryCodePage({ params }: PageProps) {
  const { code } = await params;
  const source = getLotterySource(code);
  if (!source) notFound();

  const result = await getLatestLotteryResult(source.code);
  const recent = await getRecentLotteryResults(source.code);

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="searchPanel">
        <div className="date-picker-title">Chọn ngày xem {source.shortName}</div>
        <DateSearchForm defaultDate={result?.date} code={source.code} />
      </section>
      {result ? (
        <>
          <ResultBoard result={result} />
          {recent.length ? <RecentResults results={recent} /> : null}
        </>
      ) : (
        <DataUnavailable
          title={`Chưa có dữ liệu ${source.shortName}`}
          message="Kết quả cho đài này chưa sẵn sàng. Vui lòng thử lại sau hoặc chọn một ngày khác để tra cứu."
        />
      )}
      <DisclaimerBox />
    </LotteryShell>
  );
}
