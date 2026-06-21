'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type SourceOption = {
  code: string;
  shortName: string;
  name: string;
  region: string;
};

type TicketPrizeMatch = {
  prizeLabel: string;
  prizeShortLabel: string;
  prizeNumber: string;
  matchedDigits: number;
  matchType: string;
};

type TicketCheckItem = {
  input: string;
  ticket: string;
  status: 'valid' | 'invalid';
  message: string;
  matches: TicketPrizeMatch[];
};

type CheckResponse = {
  ok: boolean;
  error?: string;
  code?: string;
  shortName?: string;
  province?: string;
  date?: string;
  displayDate?: string;
  results?: TicketCheckItem[];
};

type Props = {
  sources: SourceOption[];
  today: string;
};

const regionLabels: Record<string, string> = {
  north: 'Miền Bắc',
  south: 'Miền Nam',
  central: 'Miền Trung'
};

function provinceName(name: string) {
  return name.replace(/^Xổ số\s+/i, '');
}

function resultUrl(code?: string, date?: string) {
  if (!code || !date) return '/';
  return code === 'xsmb' ? `/xsmb/${date}` : `/${code}/${date}`;
}

function splitInput(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DoVeSoClient({ sources, today }: Props) {
  const [code, setCode] = useState('xsmb');
  const [date, setDate] = useState(today);
  const [ticketText, setTicketText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const submitAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      submitAbortRef.current?.abort();
      submitAbortRef.current = null;
    };
  }, []);

  const groupedSources = useMemo(() => {
    const groups = new Map<string, SourceOption[]>();
    for (const source of sources) {
      const region = source.region || 'other';
      const current = groups.get(region) || [];
      current.push(source);
      groups.set(region, current);
    }
    return Array.from(groups.entries());
  }, [sources]);

  const ticketCount = splitInput(ticketText).length;
  const hasResults = Boolean(response?.ok && response.results?.length);
  const resultHref = resultUrl(response?.code, response?.date);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/do-ve-so', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({ code, date, tickets: splitInput(ticketText) })
      });
      const payload = (await res.json()) as CheckResponse;

      if (!isMountedRef.current || controller.signal.aborted) return;
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Không dò được vé. Vui lòng thử lại.');
      setResponse(payload);
    } catch (err) {
      if (!isMountedRef.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Không dò được vé. Vui lòng thử lại.');
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsSubmitting(false);
      }
      if (submitAbortRef.current === controller) {
        submitAbortRef.current = null;
      }
    }
  }

  return (
    <section className="ticketChecker" aria-label="Công cụ dò vé số online">
      <form className="ticketForm" onSubmit={onSubmit}>
        <div className="ticketFormGrid">
          <label>
            <span>Tỉnh / miền</span>
            <select value={code} onChange={(event) => setCode(event.target.value)}>
              {groupedSources.map(([region, options]) => (
                <optgroup key={region} label={regionLabels[region] || region}>
                  {options.map((source) => (
                    <option key={source.code} value={source.code}>
                      {source.shortName} - {provinceName(source.name)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label>
            <span>Ngày xổ</span>
            <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        <label className="ticketTextareaLabel">
          <span>Số trên vé</span>
          <textarea
            value={ticketText}
            onChange={(event) => setTicketText(event.target.value)}
            placeholder={'Nhập một hoặc nhiều số vé, mỗi vé một dòng.\nVí dụ:\n123456\n54860'}
            rows={6}
          />
        </label>

        <div className="ticketHelpRow">
          <span>{ticketCount ? `${ticketCount} vé đang nhập` : 'Có thể dò tối đa 50 vé/lần.'}</span>
          <span>Dữ liệu chỉ dùng để tra cứu tham khảo.</span>
        </div>

        <button className="ticketSubmit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang dò vé...' : 'Dò vé số'}
        </button>
      </form>

      {error ? <div className="ticketAlert error">{error}</div> : null}

      {hasResults ? (
        <section className="ticketResults" aria-label="Kết quả dò vé">
          <div className="ticketResultsHeader">
            <div>
              <h2>Kết quả dò vé</h2>
              <p>
                {response?.shortName} ngày {response?.displayDate}. Đối chiếu với bảng kết quả đã lưu trên hệ thống.
              </p>
            </div>
            <Link href={resultHref}>Xem bảng kết quả</Link>
          </div>

          <div className="ticketResultList">
            {response?.results?.map((item, index) => (
              <article className={`ticketResultCard ${item.matches.length ? 'matched' : 'notMatched'}`} key={`${item.ticket}-${index}`}>
                <div className="ticketResultTop">
                  <strong>{item.ticket || item.input}</strong>
                  <span>{item.status === 'invalid' ? 'Không hợp lệ' : item.matches.length ? 'Có khớp giải' : 'Chưa khớp giải'}</span>
                </div>

                {item.status === 'invalid' ? <p className="ticketMessage">{item.message}</p> : null}

                {item.matches.length ? (
                  <ul className="ticketMatchList">
                    {item.matches.map((match) => (
                      <li key={`${item.ticket}-${match.prizeShortLabel}-${match.prizeNumber}`}>
                        <span className="matchPrize">{match.prizeShortLabel}</span>
                        <span className="matchNumber">{match.prizeNumber}</span>
                        <span className="matchType">{match.matchType}</span>
                      </li>
                    ))}
                  </ul>
                ) : item.status === 'valid' ? (
                  <p className="ticketMessage">{item.message}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
