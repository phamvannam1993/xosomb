'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LiveDrawWindow, LotteryLiveResult, PrizeSchemeId } from '@/lib/lottery/types';
import { getPrizeSpecs, getShortPrizeLabel } from '@/lib/lottery/schemes';
import { toVietnameseDate } from '@/lib/lottery/format';
import { hasLiveDrawStarted, isUsableInitialLiveResult, mergeLiveLotteryResults, refreshLiveDrawWindow } from '@/lib/lottery/live-state';

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

function formatVietnamDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function statusText(result: LotteryLiveResult | null, liveWindow: LiveDrawWindow, isChecking: boolean) {
  if (result?.isComplete) return 'Đã có kết quả đầy đủ';
  if (result?.prizes?.some((row) => row.numbers.length)) {
    return liveWindow.shouldPoll ? 'Đang tường thuật, có dữ liệu nào sẽ hiển thị ngay' : 'Kết quả tạm thời - đã hết khung cập nhật trực tiếp';
  }
  if (!hasLiveDrawStarted(liveWindow)) {
    return isChecking ? `Chờ quay lúc ${liveWindow.drawTime} · đang kiểm tra nguồn` : `Chờ quay lúc ${liveWindow.drawTime}`;
  }
  if (isChecking) return 'Đang kiểm tra dữ liệu mới...';
  if (liveWindow.shouldPoll) return 'Đang chờ dữ liệu từ nguồn';
  return 'Đã kết thúc khung giờ tường thuật';
}

function numberKey(label: string, value: string, index: number) {
  return `${label}-${value}-${index}`;
}

function LiveLotteryPanelInner({ code, shortName, scheme, liveWindow, initialResult = null }: LiveLotteryPanelProps) {
  const [result, setResult] = useState<LotteryLiveResult | null>(() =>
    isUsableInitialLiveResult(initialResult) ? initialResult : null
  );
  const [currentWindow, setCurrentWindow] = useState(() => refreshLiveDrawWindow(liveWindow));
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const liveAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      liveAbortRef.current?.abort();
      liveAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentWindow((current) => refreshLiveDrawWindow(current)),
      15_000
    );
    return () => window.clearInterval(timer);
  }, []);

  const prizeSpecs = useMemo(() => getPrizeSpecs(scheme), [scheme]);
  const rowsByLabel = useMemo(() => new Map((result?.prizes || []).map((row) => [row.label, row.numbers])), [result]);
  const shouldPoll = currentWindow.shouldPoll && !result?.isComplete;
  const liveDate = currentWindow.date;
  const pollIntervalMs = currentWindow.pollIntervalMs;

  const fetchLiveResult = useCallback(async () => {
    if (!liveDate || !isMountedRef.current) return;

    liveAbortRef.current?.abort();
    const controller = new AbortController();
    liveAbortRef.current = controller;

    setIsChecking(true);
    setError(null);

    try {
      const params = new URLSearchParams({ code, date: liveDate, t: String(Date.now()) });
      const response = await fetch(`/api/lottery/live?${params.toString()}`, { cache: 'no-store', signal: controller.signal });
      const payload = (await response.json().catch(() => ({}))) as LiveApiPayload;

      if (!isMountedRef.current || controller.signal.aborted) return;

      if (payload.liveWindow?.date === liveDate) setCurrentWindow(payload.liveWindow);
      if (!response.ok) throw new Error(payload.error || 'Không kiểm tra được dữ liệu live');
      if (payload.data?.date === liveDate) {
        setResult((current) => mergeLiveLotteryResults(current, payload.data || null));
      }
      setLastCheckedAt(new Date().toISOString());
    } catch (fetchError) {
      if (!isMountedRef.current || controller.signal.aborted) return;
      setError(fetchError instanceof Error ? fetchError.message : 'Không kiểm tra được dữ liệu live');
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsChecking(false);
      }
      if (liveAbortRef.current === controller) {
        liveAbortRef.current = null;
      }
    }
  }, [code, liveDate]);

  useEffect(() => {
    if (!shouldPoll || !pollIntervalMs) return undefined;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      await fetchLiveResult();
      if (!cancelled) timer = window.setTimeout(poll, pollIntervalMs);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [fetchLiveResult, pollIntervalMs, shouldPoll]);

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
                        <span
                          className={spec.isSpecial ? 'drawNumber specialNumber' : 'drawNumber'}
                          key={numberKey(spec.label, numberValue, index)}
                        >
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
          Tiến độ: {result?.completenessScore || 0}/
          {result?.expectedScore || prizeSpecs.reduce((sum, spec) => sum + spec.count, 0)} số
        </span>
        {lastCheckedAt ? <span>Kiểm tra gần nhất: {formatVietnamDateTime(lastCheckedAt)}</span> : null}
        {result?.updatedAt ? <span>Nguồn cập nhật: {formatVietnamDateTime(result.updatedAt)}</span> : null}
      </div>
    </section>
  );
}

export function LiveLotteryPanel(props: LiveLotteryPanelProps) {
  const key = `${props.code}:${props.liveWindow.date}:${props.initialResult?.updatedAt || 'empty'}`;
  return <LiveLotteryPanelInner key={key} {...props} />;
}
