import type { Metadata } from 'next';
import { LotteryShell } from '@/components/LotteryShell';
import { QuayThuSimulator } from '@/components/QuayThuSimulator';

export const metadata: Metadata = {
  title: 'Quay thử XSMB - mô phỏng xổ số miền Bắc',
  description: 'Quay thử XSMB mô phỏng bảng kết quả xổ số miền Bắc theo giao diện kết quả thật, chỉ dùng để tham khảo và không phải kết quả mở thưởng.',
  robots: { index: false, follow: true }
};

export default function QuayThuXsmbPage() {
  return (
    <LotteryShell>
      <QuayThuSimulator initialRegion="xsmb" />
    </LotteryShell>
  );
}
