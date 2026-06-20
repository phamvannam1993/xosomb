import Link from 'next/link';
import type { VietlottResult } from '@/lib/vietlott/types';
import { toVietnameseDate } from '@/lib/vietlott/format';

function productHref(result: VietlottResult) {
  return `/vietlott/${result.product}`;
}

export function VietlottBoard({ result, headingLevel = 1 }: { result: VietlottResult; headingLevel?: 1 | 2 }) {
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <article className="vietlottBoard" id={`${result.product}-${result.date}`}>
      <div className="vietlottHeader">
        <HeadingTag>
          <Link href={productHref(result)}>{result.productName}</Link>
        </HeadingTag>
        <p>
          <Link href="/vietlott">Vietlott</Link> /{' '}
          <Link href={productHref(result)}>{result.shortName}</Link> /{' '}
          <Link href={`${productHref(result)}/${result.date}`}>{result.shortName} {result.date}</Link> / {toVietnameseDate(result.date)}
        </p>
        <div className="vietlottMeta">
          {result.drawId ? <span>Kỳ quay: #{result.drawId}</span> : null}
          <span>Cập nhật: {new Date(result.updatedAt).toLocaleString('vi-VN')}</span>
        </div>
      </div>

      <div className="vietlottBalls" aria-label={`Dãy số trúng thưởng ${result.shortName}`}>
        {result.numbers.map((number, index) => (
          <span className="vietlottBall" key={`${result.product}-${result.date}-main-${index}-${number}`}>{number}</span>
        ))}
        {result.bonusNumber ? (
          <span className="vietlottBall bonusBall" key={`${result.product}-${result.date}-bonus-${result.bonusNumber}`} title="Số JP2 / số phụ">
            {result.bonusNumber}
          </span>
        ) : null}
      </div>

      <table className="vietlottTable">
        <thead>
          <tr>
            <th>Giải</th>
            <th>Dãy số / Điều kiện trúng</th>
            <th>Số lượng</th>
            <th>Giá trị giải</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, index) => (
            <tr className={index % 2 ? 'striped' : ''} key={`${row.label}-${index}`}>
              <td className="vietlottPrizeLabel">{row.label}</td>
              <td>
                {row.numbers?.length ? (
                  <div className="miniBallGroup">
                    {row.numbers.map((number, numberIndex) => (
                      <span key={`${row.label}-${index}-${numberIndex}-${number}`}>{number}</span>
                    ))}
                  </div>
                ) : row.matchText ? (
                  <span className="matchText">{row.matchText}</span>
                ) : (
                  '—'
                )}
              </td>
              <td>{row.winners || '—'}</td>
              <td className="vietlottPrizeValue">{row.prizeValue || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
