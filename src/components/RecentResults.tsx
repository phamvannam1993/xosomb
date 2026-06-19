import Link from 'next/link';
import type { LotteryResult } from '@/lib/lottery/types';
import { toVietnameseDate } from '@/lib/lottery/format';

export function RecentResults({ results, title }: { results: LotteryResult[]; title?: string }) {
  if (!results.length) return null;
  const first = results[0];

  return (
    <section className="contentPanel">
      <h2>{title || `Kết quả ${first.shortName} gần đây`}</h2>
      <p className="panelLead">Danh sách các ngày gần nhất để tra cứu nhanh giải đặc biệt và bảng kết quả chi tiết.</p>
      <div className="recentList">
        {results.map((result) => (
          <Link key={`${result.code}-${result.date}`} href={`/${result.code}/${result.date}`} className="recentItem">
            <span>{toVietnameseDate(result.date)}</span>
            <strong>{result.specialPrize}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
