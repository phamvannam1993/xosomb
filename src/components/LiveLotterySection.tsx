import { LiveLotteryPanel } from '@/components/LiveLotteryPanel';
import { getLiveDrawWindow, toLiveLotteryResult } from '@/lib/lottery/live';
import type { LotteryResult, LotterySourceConfig } from '@/lib/lottery/types';

type LiveLotterySectionProps = {
  source: LotterySourceConfig;
  result?: LotteryResult | null;
};

export function LiveLotterySection({ source, result }: LiveLotterySectionProps) {
  const liveWindow = getLiveDrawWindow(source);
  const initialResult = result?.date === liveWindow.date ? toLiveLotteryResult(result) : null;

  return (
    <LiveLotteryPanel
      code={source.code}
      shortName={source.shortName}
      scheme={source.scheme}
      liveWindow={liveWindow}
      initialResult={initialResult}
    />
  );
}
