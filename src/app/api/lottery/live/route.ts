import { NextRequest, NextResponse } from 'next/server';
import { getLotterySource } from '@/lib/lottery/catalog';
import { isFutureDate, isYyyyMmDd, todayInVietnam } from '@/lib/lottery/format';
import { getLiveDrawWindow } from '@/lib/lottery/live';
import { getLiveLotteryResult, getLotteryRuntimeConfig } from '@/lib/lottery/provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || 'xsmb').toLowerCase();
  const date = searchParams.get('date') || todayInVietnam();
  const source = getLotterySource(code);

  if (!source) {
    return json({ error: 'Mã đài không hợp lệ', code }, { status: 400 });
  }

  if (!isYyyyMmDd(date)) {
    return json({ error: 'date phải là ngày hợp lệ, định dạng YYYY-MM-DD' }, { status: 400 });
  }

  if (isFutureDate(date)) {
    return json({ error: 'Không hỗ trợ truy vấn ngày tương lai', code: source.code, date }, { status: 404 });
  }

  const liveWindow = getLiveDrawWindow(source);
  const result = await getLiveLotteryResult(source.code, date).catch(() => null);

  return json({
    code: source.code,
    source: {
      code: source.code,
      name: source.name,
      shortName: source.shortName,
      region: source.region,
      scheme: source.scheme
    },
    liveWindow,
    hasData: Boolean(result),
    data: result,
    runtime: getLotteryRuntimeConfig()
  });
}
