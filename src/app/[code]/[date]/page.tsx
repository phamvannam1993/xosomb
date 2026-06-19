import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { getLotterySource } from '@/lib/lottery/catalog';
import { isYyyyMmDd, toVietnameseDate } from '@/lib/lottery/format';
import { getLotteryResult } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ code: string; date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date)) return { title: 'Không tìm thấy dữ liệu', robots: { index: false, follow: true } };

  const result = await getLotteryResult(source.code, date).catch(() => null);
  const canonical = absoluteUrl(`/${source.code}/${date}`);

  if (!result) {
    return {
      title: `Chưa có dữ liệu ${source.shortName} ${date}`,
      description: `Trang tra cứu ${source.shortName} ngày ${date}. Kết quả ngày này hiện chưa sẵn sàng để hiển thị.`,
      robots: { index: false, follow: true },
      alternates: { canonical }
    };
  }

  return {
    title: `${source.shortName} ${date} - Kết quả ${source.name.replace(/^Xổ số\s+/i, '')} ${toVietnameseDate(date)}`,
    description: `Tra cứu ${source.shortName} ngày ${date}: bảng kết quả đầy đủ theo giải và lô tô đầu đuôi 2 số cuối.`,
    alternates: { canonical }
  };
}

export default async function LotteryCodeDatePage({ params }: PageProps) {
  const { code, date } = await params;
  const source = getLotterySource(code);
  if (!source || !isYyyyMmDd(date)) notFound();

  const result = await getLotteryResult(source.code, date);

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="searchPanel">
        <h2>Tra cứu {source.shortName} theo ngày</h2>
        <DateSearchForm defaultDate={date} code={source.code} />
      </section>
      {result ? (
        <ResultBoard result={result} />
      ) : (
        <DataUnavailable
          title={`Chưa có dữ liệu ${source.shortName} ${date}`}
          message="Kết quả cho ngày này chưa sẵn sàng. Vui lòng chọn ngày khác hoặc quay lại sau."
        />
      )}
      <DisclaimerBox />
    </LotteryShell>
  );
}
