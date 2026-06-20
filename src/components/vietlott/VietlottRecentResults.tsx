import Link from 'next/link';
import type { VietlottResult } from '@/lib/vietlott/types';
import { toVietnameseDate } from '@/lib/vietlott/format';

export function VietlottRecentResults({ results }: { results: VietlottResult[] }) {
  if (!results.length) return null;

  return (
    <section className="recentBox">
      <h2>Kết quả {results[0].shortName} gần đây</h2>
      <div className="recentGrid">
        {results.slice(0, 10).map((result) => (
          <Link href={`/vietlott/${result.product}/${result.date}`} className="recentItem" key={`${result.product}-${result.date}`}>
            <strong>{result.shortName} {result.date}</strong>
            <span>{toVietnameseDate(result.date)}</span>
            <em>{result.numbers.join(' - ')}{result.bonusNumber ? ` | JP2 ${result.bonusNumber}` : ''}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}
