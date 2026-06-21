import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { getLotterySource } from '@/lib/lottery/catalog';
import { dateTextForSeo, ddMmYyyyFromDate, isFutureDate, isYyyyMmDd } from '@/lib/lottery/format';
import { createLivePlaceholderResult, getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import { getLotteryResult, getLatestLotteryResult } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ code: string; date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date) || isFutureDate(date)) return { title: 'Không tìm thấy dữ liệu', robots: { index: false, follow: false } };

  const result = await getLotteryResult(source.code, date).catch(() => null);
  const canonical = absoluteUrl(`/${source.code}/${date}`);
  const dateLabel = dateTextForSeo(date);

  if (!result) {
    return {
      title: `Chưa có dữ liệu ${source.shortName} ${dateLabel}`,
      description: `Trang tra cứu ${source.shortName} ${dateLabel}. Kết quả ngày này hiện chưa sẵn sàng để hiển thị.`,
      robots: { index: false, follow: true },
      alternates: { canonical }
    };
  }

  return {
    title: `${source.shortName} ${dateLabel} - Kết quả ${source.name.replace(/^Xổ số\s+/i, '')}`,
    description: `Tra cứu ${source.shortName} ${dateLabel}: bảng kết quả đầy đủ theo giải và lô tô đầu đuôi 2 số cuối.`,
    alternates: { canonical }
  };
}

export default async function LotteryCodeDatePage({ params }: PageProps) {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date) || isFutureDate(date)) notFound();

  const result = await getLotteryResult(source.code, date);
  const liveWindow = getLiveDrawWindow(source);
  const liveOptions = liveWindow.shouldPoll && date === liveWindow.date
    ? {
        code: source.code,
        shortName: source.shortName,
        scheme: source.scheme,
        liveWindow,
        initialResult: result?.date === liveWindow.date ? toLiveLotteryResult(result) : null
      }
    : null;
  const liveBoardResult = result || (liveOptions ? createLivePlaceholderResult(source, liveWindow.date) : null);
  const latest = liveBoardResult || (await getLatestLotteryResult(source.code).catch(() => null));

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="searchPanel">
        <div className="date-picker-title">Tra cứu {source.shortName} theo ngày</div>
        <DateSearchForm defaultDate={date} code={source.code} />
      </section>
      {latest ? (
        <>
          <ResultBoard result={latest} live={liveBoardResult ? liveOptions : null} />
          {!result && !liveBoardResult && (
            <div className="contentPanel seoText">
              <p className="dataNotFoundMessage">
                Không có dữ liệu cho ngày {ddMmYyyyFromDate(date)}. Hiển thị kết quả mới nhất từ ngày {ddMmYyyyFromDate(latest.date)}.
              </p>
            </div>
          )}
        </>
      ) : (
        <DataUnavailable
          title={`Chưa có dữ liệu ${source.shortName}`}
          message="Kết quả chưa sẵn sàng. Vui lòng quay lại sau."
        />
      )}
      <DisclaimerBox />
    </LotteryShell>
  );
}
