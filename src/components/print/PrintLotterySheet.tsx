import type { LotteryResult } from '@/lib/lottery/types';
import { buildHeadTailTable, ddMmYyyyFromDate, formatVietnamDateTime, getResultDisplayUpdatedAt, toVietnameseDate } from '@/lib/lottery/format';
import { getShortPrizeLabel } from '@/lib/lottery/schemes';
import { absoluteUrl } from '@/lib/site';

export type PrintSheetSize = 'a4' | 'a5' | 'k80';

type Props = {
  result: LotteryResult;
  size: PrintSheetSize;
};

function resultPath(result: LotteryResult) {
  return result.code === 'xsmb' ? `/xsmb/${result.date}` : `/${result.code}/${result.date}`;
}

function SheetHeader({ result, compact = false }: { result: LotteryResult; compact?: boolean }) {
  const displayDate = ddMmYyyyFromDate(result.date);
  const onlineUrl = absoluteUrl(resultPath(result));

  return (
    <header className="printSheetHeader">
      <div className="printBrand">XoSoMB<span>.vn</span></div>
      <div className="printTitleBlock">
        <h1>Phiếu dò kết quả xổ số</h1>
        <p>{result.shortName} - {result.province}</p>
        <strong>{displayDate}{compact ? '' : ` (${toVietnameseDate(result.date).replace(/^./, (char) => char.toUpperCase())})`}</strong>
      </div>
      {!compact ? (
        <div className="printQrBox">
          <span>ONLINE</span>
          <small>{onlineUrl.replace(/^https?:\/\//, '')}</small>
        </div>
      ) : null}
    </header>
  );
}

function PrizeTable({ result }: { result: LotteryResult }) {
  return (
    <table className="printPrizeTable">
      <tbody>
        {result.prizes.map((row) => {
          const shortLabel = getShortPrizeLabel(result.scheme, row.label);
          const isSpecial = row.label === 'Đặc biệt';

          return (
            <tr key={row.label}>
              <th>{shortLabel}</th>
              <td>
                <div className={`printNumberGrid count-${Math.max(row.numbers.length, 1)}`}>
                  {row.numbers.map((number) => (
                    <span className={isSpecial ? 'printNumber special' : 'printNumber'} key={`${row.label}-${number}`}>
                      {number}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LotoTable({ result, compact = false }: { result: LotteryResult; compact?: boolean }) {
  const rows = buildHeadTailTable(result);
  const left = rows.slice(0, 5);
  const right = rows.slice(5);

  return (
    <section className="printLotoSection">
      <h2>Bảng lô tô 2 số cuối</h2>
      {compact ? (
        <div className="printLotoCompact">
          {rows.map((row) => (
            <p key={row.digit}>
              <strong>{row.digit}:</strong> {row.headValues.length ? row.headValues.join(', ') : '—'}
            </p>
          ))}
        </div>
      ) : (
        <table className="printLotoTable">
          <tbody>
            <tr>
              <th>Đầu</th>
              <th>Lô tô</th>
              <th>Đầu</th>
              <th>Lô tô</th>
            </tr>
            {left.map((row, index) => {
              const other = right[index];
              return (
                <tr key={row.digit}>
                  <th>{row.digit}</th>
                  <td>{row.headValues.length ? row.headValues.join(', ') : '—'}</td>
                  <th>{other?.digit}</th>
                  <td>{other?.headValues.length ? other.headValues.join(', ') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function SheetFooter({ result }: { result: LotteryResult }) {
  const checkedAt = formatVietnamDateTime(getResultDisplayUpdatedAt(result));

  return (
    <footer className="printSheetFooter">
      <p>Dữ liệu chỉ mang tính tham khảo. Phiếu dò này không phải vé số và không có giá trị lĩnh thưởng.</p>
      <p>
        XoSoMB.vn · {checkedAt ? `Cập nhật lúc: ${checkedAt}` : `Kết quả ngày ${ddMmYyyyFromDate(result.date)}`}
      </p>
    </footer>
  );
}

function K80Sheet({ result }: { result: LotteryResult }) {
  const displayDate = ddMmYyyyFromDate(result.date);
  const rows = buildHeadTailTable(result);

  return (
    <article className="printSheet k80">
      <div className="k80Brand">XoSoMB.vn</div>
      <h1>PHIẾU DÒ KẾT QUẢ</h1>
      <p className="k80Meta">{result.shortName} - {displayDate}</p>
      <div className="k80Divider" />
      <div className="k80PrizeList">
        {result.prizes.map((row) => (
          <p key={row.label}>
            <strong>{getShortPrizeLabel(result.scheme, row.label)}:</strong> {row.numbers.join('   ')}
          </p>
        ))}
      </div>
      <div className="k80Divider" />
      <h2>Lô tô 2 số cuối</h2>
      <div className="k80LotoGrid">
        {rows.map((row) => (
          <p key={row.digit}>
            <strong>{row.digit}:</strong> {row.headValues.length ? row.headValues.join(', ') : '—'}
          </p>
        ))}
      </div>
      <div className="k80Divider" />
      <p className="k80Disclaimer">Chỉ dùng để tra cứu, không phải vé số và không có giá trị lĩnh thưởng.</p>
    </article>
  );
}

export function PrintLotterySheet({ result, size }: Props) {
  if (size === 'k80') return <K80Sheet result={result} />;

  const compact = size === 'a5';

  return (
    <article className={`printSheet ${size}`}>
      <SheetHeader result={result} compact={compact} />
      <PrizeTable result={result} />
      <LotoTable result={result} compact={compact} />
      <SheetFooter result={result} />
    </article>
  );
}
