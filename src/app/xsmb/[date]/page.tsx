import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DateSearchForm } from '@/components/DateSearchForm';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { isYyyyMmDd, toVietnameseDate } from '@/lib/lottery/format';
import { getLotteryResult } from '@/lib/lottery/provider';

export const revalidate = 60;

type PageProps = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  if (!isYyyyMmDd(date)) return { title: 'Ngày không hợp lệ', robots: { index: false, follow: false } };

  const result = await getLotteryResult('xsmb', date).catch(() => null);
  const canonical = absoluteUrl(`/xsmb/${date}`);

  if (!result) {
    return {
      title: `Chưa có dữ liệu XSMB ${date} - Kết quả xổ số miền Bắc`,
      description: `Trang tra cứu kết quả xổ số miền Bắc ngày ${date}. Kết quả ngày này hiện chưa sẵn sàng để hiển thị.`,
      robots: { index: false, follow: true },
      alternates: { canonical }
    };
  }

  return {
    title: `XSMB ${date} - Kết quả xổ số miền Bắc ${toVietnameseDate(date)}`,
    description: `Tra cứu kết quả xổ số miền Bắc ngày ${date}: giải đặc biệt, các giải đầy đủ và bảng lô tô 2 số cuối.`,
    alternates: { canonical }
  };
}

export default async function XsmbByDatePage({ params }: PageProps) {
  const { date } = await params;
  if (!isYyyyMmDd(date)) notFound();
  const result = await getLotteryResult('xsmb', date);

  return (
    <LotteryShell>
      <MarketTabs />
      <section className="searchPanel">
        <h2>Tra cứu XSMB theo ngày</h2>
        <DateSearchForm defaultDate={date} code="xsmb" />
      </section>
      {result ? (
        <ResultBoard result={result} />
      ) : (
        <DataUnavailable
          title={`Chưa có dữ liệu XSMB ${date}`}
          message="Kết quả XSMB cho ngày này chưa sẵn sàng. Vui lòng chọn ngày khác hoặc quay lại sau."
        />
      )}
      <DisclaimerBox />
    </LotteryShell>
  );
}
