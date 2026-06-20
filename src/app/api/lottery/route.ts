import { NextRequest, NextResponse } from 'next/server';
import { getLotterySource } from '@/lib/lottery/catalog';
import { getLatestLotteryResult, getLiveLotteryResult, getLotteryResult, getLotteryRuntimeConfig, getRecentLotteryResults } from '@/lib/lottery/provider';
import { isYyyyMmDd } from '@/lib/lottery/format';
import { isCompleteLotteryResult, liveCompletenessScore } from '@/lib/lottery/normalize';

export const revalidate = 60;

function json(data: unknown, init?: ResponseInit, options: { noStore?: boolean } = {}) {
  const response = NextResponse.json(data, init);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (options.noStore) response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || 'xsmb').toLowerCase();
  const date = searchParams.get('date') || undefined;
  const recent = searchParams.get('recent');
  const source = getLotterySource(code);

  if (!source) {
    return json({ error: 'Mã đài không hợp lệ', code }, { status: 400 });
  }

  if (date && !isYyyyMmDd(date)) {
    return json({ error: 'date phải có định dạng YYYY-MM-DD' }, { status: 400 });
  }

  const live = searchParams.get('live');
  if (live === '1' || live === 'true') {
    const result = await getLiveLotteryResult(source.code, date);
    if (!result) {
      return json(
        { error: 'Chưa có dữ liệu realtime', code: source.code, date: date || null, runtime: getLotteryRuntimeConfig() },
        { status: 404 },
        { noStore: true }
      );
    }

    return json(
      {
        data: result,
        live: true,
        complete: isCompleteLotteryResult(result),
        filledCells: liveCompletenessScore(result),
        runtime: getLotteryRuntimeConfig()
      },
      undefined,
      { noStore: true }
    );
  }

  if (recent) {
    const limit = Math.min(Math.max(Number(recent) || 30, 1), 100);
    const results = await getRecentLotteryResults(source.code, limit);
    return json({ code: source.code, source, count: results.length, data: results, runtime: getLotteryRuntimeConfig() });
  }

  const result = date ? await getLotteryResult(source.code, date) : await getLatestLotteryResult(source.code);
  if (!result) {
    return json({ error: 'Chưa có dữ liệu', code: source.code, date: date || null, runtime: getLotteryRuntimeConfig() }, { status: 404 });
  }

  return json({ data: result, runtime: getLotteryRuntimeConfig() });
}
