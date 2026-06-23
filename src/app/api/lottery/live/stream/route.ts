
import { NextRequest } from 'next/server';
import { getLiveLotteryResult } from '@/lib/lottery/provider';
import { todayInVietnam } from '@/lib/lottery/format';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        try {
          const data = await getLiveLotteryResult('xsmb', todayInVietnam()).catch(() => null);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        }
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
