import { NextRequest, NextResponse } from 'next/server';
import { getVietlottProduct } from '@/lib/vietlott/catalog';
import { getLatestVietlottResult, getRecentVietlottResults, getVietlottResult, getVietlottRuntimeConfig } from '@/lib/vietlott/provider';
import { isYyyyMmDd } from '@/lib/vietlott/format';

export const revalidate = 60;

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product') || 'mega-645';
  const date = searchParams.get('date') || undefined;
  const recent = searchParams.get('recent');
  const product = getVietlottProduct(productId);

  if (!product) {
    return json({ error: 'Sản phẩm Vietlott không hợp lệ', product: productId }, { status: 400 });
  }

  if (date && !isYyyyMmDd(date)) {
    return json({ error: 'date phải có định dạng YYYY-MM-DD' }, { status: 400 });
  }

  if (recent) {
    const limit = Math.min(Math.max(Number(recent) || 30, 1), 100);
    const results = await getRecentVietlottResults(product.id, limit);
    return json({ product, count: results.length, data: results, runtime: getVietlottRuntimeConfig() });
  }

  const result = date ? await getVietlottResult(product.id, date) : await getLatestVietlottResult(product.id);
  if (!result) {
    return json({ error: 'Chưa có dữ liệu', product: product.id, date: date || null, runtime: getVietlottRuntimeConfig() }, { status: 404 });
  }

  return json({ data: result, runtime: getVietlottRuntimeConfig() });
}
