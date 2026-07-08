import type { Metadata } from 'next';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { FrequencyStatsClient } from '@/components/FrequencyStatsClient';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { fetchAz24FrequencyTable } from '@/lib/lottery/az24-frequency';
import {
  FREQUENCY_PAGE_PATH,
  buildFrequencyTableFromResults,
  normalizeFrequencyDay,
  normalizeFrequencyType,
  sanitizeFrequencyDigits,
  type FrequencyBuildOptions
} from '@/lib/lottery/frequency';
import { getRecentLotteryResults } from '@/lib/lottery/provider';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { absoluteUrl } from '@/lib/site';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Thống kê tần suất lô tô miền Bắc từ 00-99',
  description: 'Thống kê tần suất lô tô miền Bắc theo 30, 60, 100, 210 hoặc 300 kỳ mở thưởng gần nhất. Bảng tần suất 00-99 chỉ dùng để tham khảo dữ liệu.',
  alternates: { canonical: absoluteUrl(FREQUENCY_PAGE_PATH) },
  openGraph: {
    title: 'Thống kê tần suất lô tô miền Bắc từ 00-99',
    description: 'Xem bảng thống kê tần suất lô tô miền Bắc, lọc bộ số, xem theo chiều dọc hoặc chiều ngang.',
    url: absoluteUrl(FREQUENCY_PAGE_PATH),
    type: 'website'
  }
};

function selectedDigitsFromParams(params: Record<string, string | string[] | undefined>) {
  const selectionValue = Array.isArray(params.selection) ? params.selection[0] : params.selection;
  const fallbackToAll = selectionValue !== '1';
  return sanitizeFrequencyDigits(params.boso ?? params['boso[]'], fallbackToAll);
}

export default async function FrequencyPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const numOfDay = normalizeFrequencyDay(params.numOfDay);
  const statType = normalizeFrequencyType(params.type);
  const selectedDigits = selectedDigitsFromParams(params);
  const options: FrequencyBuildOptions = { selectedDigits, numOfDay, statType };

  const az24Table = selectedDigits.length ? await fetchAz24FrequencyTable(options).catch(() => null) : null;
  const recentResults = az24Table ? [] : await getRecentLotteryResults('xsmb', numOfDay).catch(() => []);
  const table = az24Table || buildFrequencyTableFromResults(recentResults, options);

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Thống kê tần suất lô tô miền Bắc', path: FREQUENCY_PAGE_PATH }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
        <FrequencyStatsClient
          table={table}
          selectedDigits={selectedDigits}
          numOfDay={numOfDay}
          statType={statType}
        />

        <section className="contentPanel frequencySeoText">
          <h2>Thống kê tần suất lô tô miền Bắc là gì?</h2>
          <p>
            Trang này tổng hợp số lần xuất hiện của các bộ số từ 00 đến 99 theo các kỳ mở thưởng gần nhất. Người dùng có thể lọc theo số ngày, lọc lô tô hoặc giải đặc biệt và chọn từng bộ số cần xem.
          </p>
          <p>
            Dữ liệu chỉ phục vụ tra cứu, đối chiếu và tham khảo thống kê; không phải cam kết, gợi ý dự đoán hay khuyến khích tham gia hoạt động may rủi.
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
