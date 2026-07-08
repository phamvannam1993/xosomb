import type { Metadata } from 'next';
import Link from 'next/link';
import { DataUnavailable } from '@/components/DataUnavailable';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { ResultBoard } from '@/components/ResultBoard';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { digitStats, getAllNumbers, getLastTwoDigits } from '@/lib/lottery/format';
import { getRecentLotteryResults } from '@/lib/lottery/provider';
import type { LotteryResult } from '@/lib/lottery/types';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'XSMB 30 ngày - Sổ kết quả xổ số miền Bắc',
  description: 'Sổ kết quả XSMB 30 ngày gần nhất, hiển thị đầy đủ từng bảng kết quả xổ số miền Bắc theo ngày.',
  alternates: { canonical: absoluteUrl('/xsmb-30-ngay') }
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PairCount = {
  digit: string;
  count: number;
};

const limitOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 200, 300, 400, 500];
const weekdayOptions = [
  { value: '', label: 'Tất cả' },
  { value: '2', label: 'Thứ hai' },
  { value: '3', label: 'Thứ ba' },
  { value: '4', label: 'Thứ tư' },
  { value: '5', label: 'Thứ năm' },
  { value: '6', label: 'Thứ sáu' },
  { value: '7', label: 'Thứ bảy' },
  { value: '8', label: 'Chủ nhật' }
];

function normalizeSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeLimit(value: string | string[] | undefined) {
  const parsed = Number(normalizeSingleParam(value) || 30);
  return limitOptions.includes(parsed) ? parsed : 30;
}

function normalizeWday(value: string | string[] | undefined) {
  const wday = normalizeSingleParam(value) || '';
  return weekdayOptions.some((item) => item.value === wday) ? wday : '';
}

function weekdayValueOf(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return jsDay === 0 ? '8' : String(jsDay + 1);
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function countPairs(values: string[], limit = 10): PairCount[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);

  return Array.from(counts.entries())
    .map(([digit, count]) => ({ digit, count }))
    .sort((a, b) => b.count - a.count || a.digit.localeCompare(b.digit))
    .slice(0, limit);
}

function buildDigitSummary(results: LotteryResult[]) {
  const allPairs = results.flatMap((result) => getAllNumbers(result).map(getLastTwoDigits));
  const headCounts = new Map<string, number>();
  const tailCounts = new Map<string, number>();
  const sumCounts = new Map<string, number>();

  for (const pair of allPairs) {
    const head = pair.charAt(0);
    const tail = pair.charAt(1);
    const sum = String((Number(head) + Number(tail)) % 10);

    headCounts.set(head, (headCounts.get(head) || 0) + 1);
    tailCounts.set(tail, (tailCounts.get(tail) || 0) + 1);
    sumCounts.set(sum, (sumCounts.get(sum) || 0) + 1);
  }

  return Array.from({ length: 10 }, (_, index) => {
    const digit = String(index);
    return {
      digit,
      head: headCounts.get(digit) || 0,
      tail: tailCounts.get(digit) || 0,
      sum: sumCounts.get(digit) || 0
    };
  });
}

function StatTable({ title, rows }: { title: string; rows: PairCount[] }) {
  if (!rows.length) return null;

  return (
    <section className="bookStatsBox">
      <h2 className="bookBoxTitle">{title}</h2>
      <div className="bookTableScroll">
        <table className="bookStatsTable">
          <tbody>
            <tr>
              <th>Bộ số</th>
              <th>Số lượt về</th>
            </tr>
            {rows.map((row) => (
              <tr key={row.digit}>
                <td>
                  <strong className="bookRedNumber">{row.digit}</strong>
                </td>
                <td>về {row.count} lần</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DigitSummaryTable({ results }: { results: LotteryResult[] }) {
  const rows = buildDigitSummary(results);

  return (
    <section className="bookStatsBox">
      <h2 className="bookBoxTitle">Thống kê đầu đuôi lô tô, tổng lô tô miền Bắc trong {results.length} ngày</h2>
      <div className="bookTableScroll">
        <table className="bookStatsTable bookTripleStats">
          <tbody>
            <tr>
              <th>Đầu</th>
              <th>Đuôi</th>
              <th>Tổng</th>
            </tr>
            {rows.map((row) => (
              <tr key={row.digit}>
                <td>
                  Đầu {row.digit}: <strong className="bookRedNumber">{row.head}</strong> lần
                </td>
                <td>
                  Đuôi {row.digit}: <strong className="bookRedNumber">{row.tail}</strong> lần
                </td>
                <td>
                  Tổng {row.digit}: <strong className="bookRedNumber">{row.sum}</strong> lần
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ThirtyDayTabs() {
  return (
    <ul className="bookTabs" aria-label="Chọn sổ kết quả 30 ngày theo miền">
      <li className="active"><Link href="/xsmb-30-ngay">XSMB 30 ngày</Link></li>
      <li><Link href="/xsmt">XSMT 30 ngày</Link></li>
      <li><Link href="/xsmn">XSMN 30 ngày</Link></li>
    </ul>
  );
}

function BookControl({ selectedWday, limit }: { selectedWday: string; limit: number }) {
  return (
    <section className="bookControl" id="result-book">
      <h2 className="bookBoxTitle">Bảng kết quả xổ số miền Bắc {limit} ngày</h2>
      <form className="bookFilterForm" action="/xsmb-30-ngay" method="get">
        <input type="hidden" name="limit" value={limit} />
        <div className="bookFilterGroup">
          <label className="bookFilterLabel" htmlFor="wday">Xem theo thứ:</label>
          <select className="bookSelect" id="wday" name="wday" defaultValue={selectedWday}>
            {weekdayOptions.map((item) => (
              <option key={item.value || 'all'} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <button className="bookSubmitButton" type="submit">Xem kết quả</button>
      </form>
      <div className="bookMoreDays">
        <span>Xem thêm:</span>
        {limitOptions.map((option) => (
          <Link
            aria-current={option === limit ? 'page' : undefined}
            className={option === limit ? 'active' : undefined}
            href={`/xsmb-30-ngay?limit=${option}${selectedWday ? `&wday=${selectedWday}` : ''}`}
            key={option}
          >
            {option === 10 ? 'XSMB 10 ngày' : `${option} ngày`}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function XsmbThirtyDaysPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const limit = normalizeLimit(params.limit);
  const selectedWday = normalizeWday(params.wday);
  const recent = await getRecentLotteryResults('xsmb', Math.max(limit, 30));
  const visibleResults = recent
    .filter((result) => !selectedWday || weekdayValueOf(result.date) === selectedWday)
    .slice(0, limit);

  const specialStats = countPairs(visibleResults.map((result) => getLastTwoDigits(result.specialPrize)), 10);
  const lotoStats = digitStats(visibleResults).filter((item) => item.count > 0).slice(0, 10);
  const sampleResult = visibleResults[1] || visibleResults[0] || null;
  const filterLabel = weekdayOptions.find((item) => item.value === selectedWday)?.label || 'Tất cả';

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'XSMB', path: '/xsmb' },
    { name: 'XSMB 30 ngày', path: '/xsmb-30-ngay' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />

        <section className="bookAnnouncement">
          <span aria-hidden="true">👉</span>
          <span>Mời bạn xem <Link href="/thong-ke-tan-suat-lo-to-mien-bac.html">Thống kê tần suất lô tô miền Bắc</Link></span>
        </section>

        <ThirtyDayTabs />

        <BookControl limit={limit} selectedWday={selectedWday} />

        {visibleResults.length ? (
          <section className="resultBookContent" aria-label={`Bảng kết quả xổ số miền Bắc ${limit} ngày`}>
            {visibleResults.map((result, index) => (
              <div className="bookResultItem" key={`${result.code}-${result.date}`}>
                <div className="bookResultTitle">
                  <h3>
                    <Link href="/xsmb">XSMB</Link> »{' '}
                    <Link href={`/xsmb/${result.date}`}>Xổ số miền Bắc {formatDateLabel(result.date)}</Link>
                  </h3>
                </div>
                <ResultBoard result={result} headingLevel={2} />
                {index < visibleResults.length - 1 ? <div className="bookItemDivider" aria-hidden="true" /> : null}
              </div>
            ))}
          </section>
        ) : (
          <DataUnavailable title={`Chưa có sổ kết quả ${filterLabel.toLowerCase()}`} />
        )}

        {visibleResults.length ? (
          <>
            <section className="bookSeeMore">
              <ul>
                <li>Mời bạn xem <Link href="/thong-ke-tan-suat-lo-to-mien-bac.html">thống kê tần suất lô tô miền Bắc</Link></li>
                <li>Xem <Link href="/thong-ke">thống kê XSMB</Link> hôm nay</li>
                <li>Thử vận may với <Link href="/quay-thu-xsmb" rel="nofollow">quay thử XSMB</Link></li>
              </ul>
            </section>

            <div className="bookStatsGrid">
              <StatTable title={`Thống kê giải đặc biệt miền Bắc ${visibleResults.length} ngày về nhiều nhất`} rows={specialStats} />
              <StatTable title={`Thống kê lô tô miền Bắc ${visibleResults.length} ngày về nhiều nhất`} rows={lotoStats} />
            </div>
            <DigitSummaryTable results={visibleResults} />
          </>
        ) : null}

        <section className="contentPanel seoText">
          <h2>Cách sử dụng sổ kết quả {limit} ngày</h2>
          <p>
            Trang này hiển thị đầy đủ từng bảng kết quả trong danh sách {limit} ngày gần nhất. Bạn có thể lọc nhanh theo thứ,
            xem bảng lô tô đầu đuôi dưới từng ngày và đối chiếu các thống kê tổng hợp ở cuối trang.
            {sampleResult ? (
              <>
                {' '}
                Ví dụ: <Link href={`/xsmb/${sampleResult.date}`}>xem riêng kết quả ngày {formatDateLabel(sampleResult.date)}</Link>.
              </>
            ) : null}
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
