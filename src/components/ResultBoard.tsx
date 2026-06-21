'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { LiveDrawWindow, LotteryLiveResult, LotteryResult, PrizeRow, PrizeSchemeId, PrizeSpec } from '@/lib/lottery/types';
import { buildHeadTailTable, ddMmYyyyFromDate, toVietnameseDate } from '@/lib/lottery/format';
import { getPrizeSpecs, getShortPrizeLabel } from '@/lib/lottery/schemes';

type DisplayMode = 'all' | 'last2' | 'last3';
type CellState = 'done' | 'active' | 'pending';

type ResultBoardLiveOptions = {
  code: string;
  shortName: string;
  scheme: PrizeSchemeId;
  liveWindow: LiveDrawWindow;
  initialResult?: LotteryLiveResult | null;
};

type ResultBoardProps = {
  result: LotteryResult;
  headingLevel?: 1 | 2;
  live?: ResultBoardLiveOptions | null;
};

type LiveApiPayload = {
  data?: LotteryLiveResult | null;
  liveWindow?: LiveDrawWindow;
  hasData?: boolean;
  error?: string;
};

type CurrentPosition = {
  label: string;
  slotIndex: number;
} | null;

const digits = Array.from({ length: 10 }, (_, index) => String(index));

function displayNumber(value: string, mode: DisplayMode) {
  if (mode === 'last2') return value.slice(-2);
  if (mode === 'last3') return value.slice(-3);
  return value;
}

function rollingDigitLength(spec: PrizeSpec, mode: DisplayMode) {
  if (mode === 'last2') return Math.min(2, spec.length);
  if (mode === 'last3') return Math.min(3, spec.length);
  return spec.length;
}

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function titleFor(result: LotteryResult) {
  if (result.code === 'xsmb') return 'XSMB - Kết quả xổ số miền Bắc';
  return `${result.shortName} - Kết quả ${result.province}`;
}

function liveDrawOrder(specs: PrizeSpec[], scheme: PrizeSchemeId) {
  // Giao diện bảng miền Bắc vẫn đặt ĐB lên trên, nhưng khi quay trực tiếp thì ĐB thường để cuối.
  // Như vậy các ô G1/G2/G3... quay kiểu giống trang quay thử, còn ĐB vẫn hiện vòng quay chờ.
  if (scheme !== 'north') return specs;
  return [...specs.filter((spec) => !spec.isSpecial), ...specs.filter((spec) => spec.isSpecial)];
}

function rowsMap(rows: PrizeRow[] = []) {
  return new Map(rows.map((row) => [row.label, row.numbers]));
}

function inferCurrentPosition(result: LotteryLiveResult | null, scheme: PrizeSchemeId): CurrentPosition {
  const specs = liveDrawOrder(getPrizeSpecs(scheme), scheme);
  if (!result) {
    const firstSpec = specs[0];
    return firstSpec ? { label: firstSpec.label, slotIndex: 0 } : null;
  }
  if (result.isComplete) return null;

  const numbersByLabel = rowsMap(result.prizes);

  for (const spec of specs) {
    const numbers = numbersByLabel.get(spec.label) || [];
    if (numbers.length > 0 && numbers.length < spec.count) {
      return { label: spec.label, slotIndex: numbers.length };
    }
  }

  const filledIndexes = specs
    .map((spec, index) => ({ index, count: numbersByLabel.get(spec.label)?.length || 0 }))
    .filter((item) => item.count > 0)
    .map((item) => item.index);

  if (filledIndexes.length) {
    const lastFilledIndex = Math.max(...filledIndexes);
    for (let index = lastFilledIndex + 1; index < specs.length; index += 1) {
      const spec = specs[index];
      const count = numbersByLabel.get(spec.label)?.length || 0;
      if (count < spec.count) return { label: spec.label, slotIndex: count };
    }
  }

  const firstIncomplete = specs.find((spec) => (numbersByLabel.get(spec.label)?.length || 0) < spec.count);
  return firstIncomplete
    ? { label: firstIncomplete.label, slotIndex: numbersByLabel.get(firstIncomplete.label)?.length || 0 }
    : null;
}

function liveStatusText(
  result: LotteryLiveResult | null,
  currentPosition: CurrentPosition,
  scheme: PrizeSchemeId,
  isChecking: boolean
) {
  if (result?.isComplete) return 'Tường thuật kết quả đầy đủ';
  if (currentPosition) {
    return `Đang quay ${getShortPrizeLabel(scheme, currentPosition.label)} - ô ${currentPosition.slotIndex + 1}`;
  }
  if (isChecking) return 'Đang kiểm tra dữ liệu mới';
  return 'Chuẩn bị quay số';
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('vi-VN');
}

function buildLiveRows(specs: PrizeSpec[], liveResult: LotteryLiveResult | null): PrizeRow[] {
  const numbersByLabel = rowsMap(liveResult?.prizes || []);
  return specs.map((spec) => ({
    label: spec.label,
    numbers: (numbersByLabel.get(spec.label) || []).slice(0, spec.count)
  }));
}

function isActiveCell(position: CurrentPosition, label: string, slotIndex: number) {
  return Boolean(position && position.label === label && position.slotIndex === slotIndex);
}

function cellState(value: string | undefined, active: boolean, liveMode: boolean): CellState {
  if (value) return 'done';
  if (liveMode && active) return 'active';
  return liveMode ? 'pending' : 'pending';
}

function RollingNumber({ length }: { length: number }) {
  const [value, setValue] = useState(() => '0'.repeat(Math.max(1, length)));

  useEffect(() => {
    const timer = window.setInterval(() => setValue(randomDigits(Math.max(1, length))), 90);
    return () => window.clearInterval(timer);
  }, [length]);

  return <>{value}</>;
}

function LivePendingSlot() {
  return (
    <span className="livePendingSlot" aria-label="Đang chờ quay số">
      <span className="liveSpinRing" />
    </span>
  );
}

function PrizeNumberCell({
  value,
  mode,
  state,
  spec,
  isSpecial,
  isHighlighted
}: {
  value?: string;
  mode: DisplayMode;
  state: CellState;
  spec: PrizeSpec;
  isSpecial: boolean;
  isHighlighted: boolean;
}) {
  if (state === 'active') {
    return (
      <span
        className={isSpecial ? 'drawNumber specialNumber liveActiveNumber' : 'drawNumber liveActiveNumber'}
        data-spinning="true"
        data-live-state="active"
        title="Đang quay"
      >
        <RollingNumber length={rollingDigitLength(spec, mode)} />
      </span>
    );
  }

  if (!value) return <LivePendingSlot />;

  const lastTwo = value.slice(-2);
  return (
    <span
      className={isSpecial ? 'drawNumber specialNumber' : 'drawNumber'}
      data-original={value}
      data-last-two={lastTwo}
      data-highlighted={isHighlighted ? 'true' : 'false'}
      data-live-state="done"
      title={value}
    >
      {displayNumber(value, mode)}
    </span>
  );
}

export function ResultBoard({ result, headingLevel = 1, live = null }: ResultBoardProps) {
  const [mode, setMode] = useState<DisplayMode>('all');
  const [activeDigit, setActiveDigit] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<LotteryLiveResult | null>(live?.initialResult || null);
  const [currentWindow, setCurrentWindow] = useState<LiveDrawWindow | null>(live?.liveWindow || null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const prizeSpecs = useMemo(() => getPrizeSpecs(result.scheme), [result.scheme]);
  const currentPosition = useMemo(() => inferCurrentPosition(liveResult, result.scheme), [liveResult, result.scheme]);
  const isLiveMode = Boolean(live && currentWindow?.shouldPoll);
  const shouldPoll = Boolean(isLiveMode && !liveResult?.isComplete && currentWindow?.date);

  const fetchLiveResult = useCallback(async () => {
    if (!live || !currentWindow?.date) return;

    setIsChecking(true);
    setLiveError(null);

    try {
      const params = new URLSearchParams({ code: live.code, date: currentWindow.date, t: String(Date.now()) });
      const response = await fetch(`/api/lottery/live?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as LiveApiPayload;

      if (payload.liveWindow) setCurrentWindow(payload.liveWindow);
      if (!response.ok) throw new Error(payload.error || 'Không kiểm tra được dữ liệu live');
      if (payload.data) setLiveResult(payload.data);
      setLastCheckedAt(new Date().toISOString());
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Không kiểm tra được dữ liệu live');
    } finally {
      setIsChecking(false);
    }
  }, [currentWindow?.date, live]);

  useEffect(() => {
    if (!shouldPoll || !currentWindow?.pollIntervalMs) return undefined;

    fetchLiveResult();
    const timer = window.setInterval(fetchLiveResult, currentWindow.pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [currentWindow?.pollIntervalMs, fetchLiveResult, shouldPoll]);

  const liveRows = useMemo(() => buildLiveRows(prizeSpecs, liveResult), [liveResult, prizeSpecs]);
  const displayRows = isLiveMode ? liveRows : result.prizes;
  const displayDate = isLiveMode && currentWindow?.date ? currentWindow.date : result.date;
  const displayUpdatedAt = isLiveMode
    ? liveResult?.updatedAt || lastCheckedAt || result.updatedAt
    : result.updatedAt;

  const headTailRows = buildHeadTailTable({
    ...result,
    date: displayDate,
    specialPrize: isLiveMode ? liveResult?.specialPrize || '' : result.specialPrize,
    prizes: displayRows.filter((row) => row.numbers.length),
    updatedAt: displayUpdatedAt
  });
  const dateText = toVietnameseDate(displayDate);
  const displayDateText = ddMmYyyyFromDate(displayDate);
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';
  const updatedAtText = formatUpdatedAt(displayUpdatedAt);
  const liveStatus = liveStatusText(liveResult, currentPosition, result.scheme, isChecking);

  return (
    <article className="resultBoard" id={`${result.code}-${displayDate}`} data-live={isLiveMode ? 'true' : 'false'}>
      <table className="lotteryTable">
        <tbody>
          <tr>
            <th colSpan={2} className="resultHeading">
              <HeadingTag>
                <Link href={`/${result.code}`}>{titleFor(result)}</Link>
              </HeadingTag>
              <p>
                <Link href={`/${result.code}`}>{result.shortName}</Link> /{' '}
                <Link href={`/${result.code}/${displayDate}`}>Kết quả ngày {displayDateText}</Link> / {dateText}
              </p>
            </th>
          </tr>
          <tr>
            <td colSpan={2} className="codeRow" data-live={isLiveMode ? liveResult?.status || 'running' : 'complete'}>
              {isLiveMode ? liveStatus : `Kết quả đầy đủ ngày ${displayDateText}`}
              {updatedAtText ? ` · ${isLiveMode ? 'Cập nhật' : 'Dữ liệu kiểm tra lúc'}: ${updatedAtText}` : null}
              {liveError ? <span className="liveInlineError"> · {liveError}</span> : null}
            </td>
          </tr>
          {displayRows.map((row, index) => {
            const spec = prizeSpecs.find((item) => item.label === row.label) || {
              label: row.label,
              shortLabel: getShortPrizeLabel(result.scheme, row.label),
              count: row.numbers.length,
              length: row.numbers[0]?.length || 5
            };
            const isSpecial = Boolean(spec.isSpecial || row.label === 'Đặc biệt');
            const slotCount = isLiveMode ? spec.count : row.numbers.length;
            const gridCount = Math.max(slotCount, 1);

            return (
              <tr className={index % 2 === 0 ? '' : 'striped'} key={row.label} data-live-row={isLiveMode ? 'true' : 'false'}>
                <td className={isSpecial ? 'prizeLabel specialLabel' : 'prizeLabel'}>
                  {getShortPrizeLabel(result.scheme, row.label)}
                </td>
                <td className="prizeCell">
                  <div className={`numberGrid count-${gridCount}`}>
                    {Array.from({ length: gridCount }).map((_, numberIndex) => {
                      const number = row.numbers[numberIndex];
                      const lastTwo = number?.slice(-2) || '';
                      const highlighted = Boolean(number && activeDigit && lastTwo.includes(activeDigit));
                      const active = isLiveMode && isActiveCell(currentPosition, row.label, numberIndex);
                      const state = cellState(number, active, isLiveMode);

                      return (
                        <PrizeNumberCell
                          isHighlighted={highlighted}
                          isSpecial={isSpecial}
                          key={`${row.label}-${numberIndex}-${number || 'pending'}`}
                          mode={mode}
                          spec={spec}
                          state={state}
                          value={number}
                        />
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="filterContainer">
        <fieldset className="radioGroup">
          <legend>Kiểu hiển thị</legend>
          <label>
            <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} /> Đầy đủ
          </label>
          <label>
            <input type="radio" checked={mode === 'last2'} onChange={() => setMode('last2')} /> 2 số
          </label>
          <label>
            <input type="radio" checked={mode === 'last3'} onChange={() => setMode('last3')} /> 3 số
          </label>
        </fieldset>
        <div className="digitFilter" aria-label="Lọc nhanh chữ số cuối">
          {digits.map((digit) => (
            <button
              type="button"
              className={activeDigit === digit ? 'digitButton active' : 'digitButton'}
              onMouseEnter={() => setActiveDigit(digit)}
              onMouseLeave={() => setActiveDigit(null)}
              onFocus={() => setActiveDigit(digit)}
              onBlur={() => setActiveDigit(null)}
              onClick={() => setActiveDigit(activeDigit === digit ? null : digit)}
              key={digit}
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      <table className="lotoTable">
        <tbody>
          <tr>
            <th colSpan={4} className="lotoTitle">
              <Link href={`/${result.code}`}>
                {isLiveMode && !liveResult?.isComplete ? 'Bảng lô tô tạm tính' : `Bảng lô tô 2 số cuối ${result.shortName}`}
              </Link>{' '}
              / <Link href={`/${result.code}`}>Sổ kết quả gần đây</Link>
            </th>
          </tr>
          <tr>
            <th>Đầu</th>
            <th>Lô tô</th>
            <th>Đuôi</th>
            <th>Lô tô</th>
          </tr>
          {headTailRows.map((row, index) => (
            <tr className={index % 2 === 0 ? 'striped' : ''} key={row.digit}>
              <td className="digitCell">{row.digit}</td>
              <td>{row.headValues.length ? row.headValues.join(', ') : '—'}</td>
              <td className="digitCell">{row.digit}</td>
              <td>{row.tailValues.length ? row.tailValues.join(', ') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
