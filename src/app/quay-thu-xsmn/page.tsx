import type { Metadata } from 'next';
import { LotteryShell } from '@/components/LotteryShell';
import { QuayThuSimulator } from '@/components/QuayThuSimulator';

export const metadata: Metadata = {
  title: 'Quay thử XSMN - mô phỏng xổ số miền Nam',
  description: 'Quay thử XSMN mô phỏng bảng kết quả xổ số miền Nam theo từng đài, chỉ dùng để tham khảo và không phải kết quả mở thưởng.',
  robots: { index: false, follow: true }
};

export default function QuayThuXsmnPage() {
  return (
    <LotteryShell>
      <QuayThuSimulator initialRegion="xsmn" />
    </LotteryShell>
  );
}
