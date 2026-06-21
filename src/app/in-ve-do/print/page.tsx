import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PrintActionButton } from '@/components/print/PrintActionButton';
import { PrintLotterySheet, type PrintSheetSize } from '@/components/print/PrintLotterySheet';
import { getLotterySource } from '@/lib/lottery/catalog';
import { ddMmYyyyFromDate, isFutureDate, isYyyyMmDd, todayInVietnam } from '@/lib/lottery/format';
import { getLatestLotteryResult, getLotteryResult } from '@/lib/lottery/provider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Xem trước phiếu dò kết quả xổ số',
  description: 'Trang xem trước bản in phiếu dò kết quả xổ số.',
  robots: { index: false, follow: false }
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSize(value?: string): PrintSheetSize {
  if (value === 'a5' || value === 'k80') return value;
  return 'a4';
}

export default async function InVeDoPrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawCode = (one(params.code) || 'xsmb').toLowerCase();
  const source = getLotterySource(rawCode);
  if (!source) notFound();
  if (rawCode !== source.code) {
    const dateParam = one(params.date);
    const sizeParam = normalizeSize(one(params.size));
    const nextDate = dateParam ? `&date=${encodeURIComponent(dateParam)}` : '';
    redirect(`/in-ve-do/print?code=${source.code}${nextDate}&size=${sizeParam}`);
  }

  const size = normalizeSize(one(params.size));
  const rawDate = one(params.date);

  let result = null;
  if (rawDate) {
    if (!isYyyyMmDd(rawDate) || isFutureDate(rawDate)) notFound();
    result = await getLotteryResult(source.code, rawDate);
  } else {
    result = await getLatestLotteryResult(source.code);
  }

  if (!result || result.date > todayInVietnam()) notFound();

  const resultHref = source.code === 'xsmb' ? `/xsmb/${result.date}` : `/${source.code}/${result.date}`;

  return (
    <main className={`printPage print-${size}`}>
      <div className="printActionBar no-print">
        <div>
          <strong>Xem trước phiếu dò {result.shortName}</strong>
          <span>Ngày {ddMmYyyyFromDate(result.date)} · Khổ {size.toUpperCase()}</span>
        </div>
        <div className="printActionButtons">
          <PrintActionButton />
          <Link href={resultHref}>Xem kết quả gốc</Link>
          <Link href="/in-ve-do">Tạo phiếu khác</Link>
        </div>
      </div>

      <section className="printCanvas" aria-label="Bản xem trước phiếu dò">
        <PrintLotterySheet result={result} size={size} />
      </section>
    </main>
  );
}
