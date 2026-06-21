import { NextRequest, NextResponse } from 'next/server';
import { getAllLotterySources, getLotterySource } from '@/lib/lottery/catalog';
import { todayInVietnam } from '@/lib/lottery/format';
import { getLatestLotteryResult, getLiveLotteryResult, getRecentLotteryResults } from '@/lib/lottery/provider';
import { getAllVietlottProducts, getVietlottProduct } from '@/lib/vietlott/catalog';
import { getLatestVietlottResult, getRecentVietlottResults } from '@/lib/vietlott/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WarmStatus = 'fulfilled' | 'rejected';

type WarmItem = {
  type: 'lottery' | 'vietlott';
  key: string;
  status: WarmStatus;
  latestDate?: string | null;
  recentCount?: number;
  liveStatus?: string | null;
  error?: string;
};

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

function getCronSecret() {
  return process.env.CACHE_WARM_SECRET || process.env.CRON_SECRET || process.env.WARM_CACHE_SECRET || '';
}

function isAuthorized(request: NextRequest) {
  const secret = getCronSecret();

  // Cho phép chạy local/dev không cần secret để test nhanh.
  // Production nên bắt buộc có secret để tránh người ngoài gọi làm tốn tài nguyên.
  if (!secret) return process.env.NODE_ENV !== 'production';

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerSecret = request.headers.get('x-cron-secret') || request.headers.get('x-cache-warm-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');

  return bearer === secret || headerSecret === secret || querySecret === secret;
}

function parseLimit(value: string | null) {
  const parsed = Number(value || 7);
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(Math.max(Math.floor(parsed), 1), 30);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}

function getLotteryCodes(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawCodes = searchParams.get('codes');
  const scope = (searchParams.get('scope') || 'core').toLowerCase();

  if (rawCodes) {
    return unique(rawCodes.split(',')).filter((code) => Boolean(getLotterySource(code)));
  }

  if (scope === 'all' || scope === 'lottery') {
    return getAllLotterySources().map((source) => source.code);
  }

  // Mặc định chỉ warm các trang trục chính để nhẹ tải.
  return ['xsmb', 'xsmn', 'xsmt'];
}

function getVietlottProductIds(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawProducts = searchParams.get('products');
  const scope = (searchParams.get('scope') || 'core').toLowerCase();

  if (scope !== 'all' && scope !== 'vietlott') return [];

  if (rawProducts) {
    return unique(rawProducts.split(',')).filter((product) => Boolean(getVietlottProduct(product)));
  }

  return getAllVietlottProducts().map((product) => product.id);
}

async function runWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  const safeConcurrency = Math.min(Math.max(concurrency, 1), 8);

  for (let index = 0; index < items.length; index += safeConcurrency) {
    const chunk = items.slice(index, index + safeConcurrency);
    results.push(...(await Promise.all(chunk.map(worker))));
  }

  return results;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function warmLotteryCode(code: string, limit: number, includeLive: boolean): Promise<WarmItem> {
  try {
    const [latest, recent, live] = await Promise.all([
      getLatestLotteryResult(code),
      getRecentLotteryResults(code, limit),
      includeLive ? getLiveLotteryResult(code, todayInVietnam()).catch(() => null) : Promise.resolve(null)
    ]);

    return {
      type: 'lottery',
      key: code,
      status: 'fulfilled',
      latestDate: latest?.date || null,
      recentCount: recent.length,
      liveStatus: live?.status || null
    };
  } catch (error) {
    return {
      type: 'lottery',
      key: code,
      status: 'rejected',
      error: errorMessage(error)
    };
  }
}

async function warmVietlottProduct(productId: string, limit: number): Promise<WarmItem> {
  try {
    const [latest, recent] = await Promise.all([
      getLatestVietlottResult(productId),
      getRecentVietlottResults(productId, limit)
    ]);

    return {
      type: 'vietlott',
      key: productId,
      status: 'fulfilled',
      latestDate: latest?.date || null,
      recentCount: recent.length
    };
  } catch (error) {
    return {
      type: 'vietlott',
      key: productId,
      status: 'rejected',
      error: errorMessage(error)
    };
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = parseLimit(searchParams.get('limit'));
  const includeLive = searchParams.get('live') === '1' || searchParams.get('live') === 'true';
  const concurrency = Number(searchParams.get('concurrency') || process.env.CACHE_WARM_CONCURRENCY || 3);
  const startedAt = new Date();

  const lotteryCodes = getLotteryCodes(request);
  const vietlottProducts = getVietlottProductIds(request);

  const [lotteryResults, vietlottResults] = await Promise.all([
    runWithConcurrency(lotteryCodes, concurrency, (code) => warmLotteryCode(code, limit, includeLive)),
    runWithConcurrency(vietlottProducts, concurrency, (productId) => warmVietlottProduct(productId, limit))
  ]);

  const items = [...lotteryResults, ...vietlottResults];
  const failed = items.filter((item) => item.status === 'rejected');
  const finishedAt = new Date();

  return json({
    ok: failed.length === 0,
    scope: searchParams.get('scope') || 'core',
    limit,
    live: includeLive,
    warmed: items.length,
    failed: failed.length,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    items
  }, failed.length ? { status: 207 } : undefined);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
