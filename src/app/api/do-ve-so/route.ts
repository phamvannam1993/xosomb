import { NextRequest, NextResponse } from 'next/server';
import { getLotterySource } from '@/lib/lottery/catalog';
import { ddMmYyyyFromDate, isFutureDate, isYyyyMmDd } from '@/lib/lottery/format';
import { getLotteryResult } from '@/lib/lottery/provider';
import { checkTicketsAgainstResult, getMaxTicketsPerRequest, normalizeTicketInputs } from '@/lib/lottery/check-ticket';

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

type CheckTicketBody = {
  code?: string;
  date?: string;
  ticket?: string;
  tickets?: string[];
};

export async function POST(request: NextRequest) {
  let body: CheckTicketBody;

  try {
    body = (await request.json()) as CheckTicketBody;
  } catch {
    return json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const code = String(body.code || 'xsmb').toLowerCase();
  const source = getLotterySource(code);

  if (!source) {
    return json({ ok: false, error: 'Mã đài không hợp lệ.', code }, { status: 400 });
  }

  const date = String(body.date || '');
  if (!isYyyyMmDd(date)) {
    return json({ ok: false, error: 'Ngày dò vé phải có định dạng YYYY-MM-DD.' }, { status: 400 });
  }

  if (isFutureDate(date)) {
    return json({ ok: false, error: 'Không hỗ trợ dò vé cho ngày tương lai.', code: source.code, date }, { status: 404 });
  }

  const inputs = normalizeTicketInputs(body.tickets?.length ? body.tickets : body.ticket);
  if (!inputs.length) {
    return json({ ok: false, error: 'Vui lòng nhập ít nhất một số vé.' }, { status: 400 });
  }

  const result = await getLotteryResult(source.code, date);
  if (!result) {
    return json(
      {
        ok: false,
        error: `Chưa có dữ liệu kết quả ${source.shortName} ngày ${ddMmYyyyFromDate(date)} để dò vé.`,
        code: source.code,
        date
      },
      { status: 404 }
    );
  }

  const checkedResults = checkTicketsAgainstResult(inputs, result);

  return json({
    ok: true,
    code: source.code,
    shortName: source.shortName,
    province: source.name,
    date: result.date,
    displayDate: ddMmYyyyFromDate(result.date),
    maxTickets: getMaxTicketsPerRequest(),
    resultUpdatedAt: result.updatedAt,
    results: checkedResults
  });
}
