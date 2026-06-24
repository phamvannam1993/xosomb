import { NextRequest, NextResponse } from 'next/server';
import { getLotterySource } from '@/lib/lottery/catalog';
import { isFutureDate, isYyyyMmDd, todayInVietnam } from '@/lib/lottery/format';
import { getLiveLotteryResult } from '@/lib/lottery/provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

function clampInterval(value: string | null) {
  const parsed = Number(value || 3000);
  if (!Number.isFinite(parsed)) return 3000;
  return Math.min(Math.max(Math.floor(parsed), 3000), 15000);
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || 'xsmb').toLowerCase();
  const date = request.nextUrl.searchParams.get('date') || todayInVietnam();
  const intervalMs = clampInterval(request.nextUrl.searchParams.get('interval'));
  const source = getLotterySource(code);

  if (!source) return json({ error: 'Mã đài không hợp lệ', code }, { status: 400 });
  if (!isYyyyMmDd(date)) return json({ error: 'date phải là ngày hợp lệ, định dạng YYYY-MM-DD' }, { status: 400 });
  if (isFutureDate(date)) return json({ error: 'Không hỗ trợ truy vấn ngày tương lai', code: source.code, date }, { status: 404 });

  const encoder = new TextEncoder();
  const signal = request.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      while (!signal.aborted) {
        try {
          const data = await getLiveLotteryResult(source.code, date).catch(() => null);
          if (signal.aborted) break;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ code: source.code, date, data })}\n\n`));
        } catch {
          if (signal.aborted) break;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ code: source.code, date, error: true })}\n\n`));
        }

        await sleep(intervalMs, signal);
      }

      try {
        controller.close();
      } catch {
        // Client đã đóng kết nối.
      }
    },
    cancel() {
      // NextRequest.signal sẽ báo abort; không cần xử lý thêm.
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
