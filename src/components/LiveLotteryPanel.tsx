'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LiveDrawWindow, LotteryLiveResult, PrizeSchemeId } from '@/lib/lottery/types';
import { getPrizeSpecs, getShortPrizeLabel } from '@/lib/lottery/schemes';
import { toVietnameseDate } from '@/lib/lottery/format';

type LiveLotteryPanelProps = {
  code: string;
  shortName: string;
  scheme: PrizeSchemeId;
  liveWindow: LiveDrawWindow;
  initialResult?: LotteryLiveResult | null;
};

type LiveApiPayload = {
  data?: LotteryLiveResult | null;
  liveWindow?: LiveDrawWindow;
  hasData?: boolean;
  error?: string;
};

function statusText(result: LotteryLiveResult | null, liveWindow: LiveDrawWindow, isChecking: boolean) {
  if (result?.isComplete) return 'Đã có kết quả đầy đủ';
  if (result?.prizes?.length) return 'Đang tường thuật, có dữ liệu nào sẽ hiển thị ngay';
  if (isChecking) return 'Đang kiểm tra dữ liệu mới...';
  if (liveWindow.shouldPoll) return 'Sắp đến giờ quay, hệ thống đang tự động cập nhật';
  return 'Chưa đến giờ tường thuật trực tiếp';
}

function numberKey(label: string, value: string, index: number) {
  return `${label}-${value}-${index}`;
}

export function LiveLotteryPanel({ code, shortName, scheme, liveWindow, initialResult = null }: LiveLotteryPanelProps) {
  const [result, setResult] = useState<LotteryLiveResult | null>(initialResult);
  const [currentWindow, setCurrentWindow] = useState(liveWindow);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const prizeSpecs = useMemo(() => getPrizeSpecs(scheme), [scheme]);
  const rowsByLabel = useMemo(() => new Map((result?.prizes || []).map((row) => [row.label, row.numbers])), [result]);
  const shouldPoll = currentWindow.shouldPoll && !result?.isComplete;

  const fetchLiveResult = useCallback(async () => {
    if (!currentWindow.date) return;

    setIsChecking(true);
    setError(null);

    try {
      const params = new URLSearchParams({ code, date: currentWindow.date, t: String(Date.now()) });
      const response = await fetch(`/api/lottery/live?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as LiveApiPayload;

      if (payload.liveWindow) setCurrentWindow(payload.liveWindow);
      if (!response.ok) throw new Error(payload.error || 'Không kiểm tra được dữ liệu live');
      if (payload.data) setResult(payload.data);
      setLastCheckedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không kiểm tra được dữ liệu live');
    } finally {
      setIsChecking(false);
    }
  }, [code, currentWindow.date]);

  useEffect(() => {
    if (!shouldPoll) return undefined;

    fetchLiveResult();
    const timer = window.setInterval(fetchLiveResult, currentWindow.pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [currentWindow.pollIntervalMs, fetchLiveResult, shouldPoll]);

  if (!currentWindow.shouldPoll && !result) return null;

  return (
    <section className="livePanel" aria-live="polite">
      <div className="livePanelHeader">
        <div>
          <p className="liveEyebrow">Tường thuật tự động</p>
          <h2>{shortName} hôm nay - cập nhật khi quay số</h2>
          <p>
            {toVietnameseDate(currentWindow.date)} · Dự kiến quay lúc {currentWindow.drawTime}. Dữ liệu được kiểm tra tự động,
            có giải nào sẽ hiển thị giải đó.
          </p>
        </div>
        <span className={result?.isComplete ? 'liveStatus complete' : 'liveStatus'}>
          {statusText(result, currentWindow, isChecking)}
        </span>
      </div>

      {error ? <p className="liveError">{error}. Hệ thống sẽ thử lại ở lần kiểm tra kế tiếp.</p> : null}

      <table className="liveTable">
        <tbody>
          {prizeSpecs.map((spec) => {
            const numbers = rowsByLabel.get(spec.label) || [];
            return (
              <tr key={spec.label} className={spec.isSpecial ? 'liveSpecialRow' : undefined}>
                <td className="livePrizeLabel">{getShortPrizeLabel(scheme, spec.label)}</td>
                <td className="livePrizeNumbers">
                  {numbers.length ? (
                    <div className={`numberGrid count-${Math.max(numbers.length, 1)}`}>
                      {numbers.map((numberValue, index) => (
                        <span className={spec.isSpecial ? 'drawNumber specialNumber' : 'drawNumber'} key={numberKey(spec.label, numberValue, index)}>
                          {numberValue}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="waitingNumber">Đang chờ...</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="liveMeta">
        <span>
          Tiến độ: {result?.completenessScore || 0}/{result?.expectedScore || prizeSpecs.reduce((sum, spec) => sum + spec.count, 0)} số
        </span>
        {lastCheckedAt ? <span>Kiểm tra gần nhất: {lastCheckedAt}</span> : null}
        {result?.updatedAt ? <span>Nguồn cập nhật: {new Date(result.updatedAt).toLocaleString('vi-VN')}</span> : null}
      </div>
    </section>
  );
}
