import type { Metadata } from 'next';
import { LotteryShell } from '@/components/LotteryShell';
import { QuayThuSimulator } from '@/components/QuayThuSimulator';

export const metadata: Metadata = {
  title: 'Quay thử XSMT - mô phỏng xổ số miền Trung',
  description: 'Quay thử XSMT mô phỏng bảng kết quả xổ số miền Trung theo từng đài, chỉ dùng để tham khảo và không phải kết quả mở thưởng.',
  robots: { index: false, follow: true }
};

export default function QuayThuXsmtPage() {
  return (
    <LotteryShell>
      <QuayThuSimulator initialRegion="xsmt" />
    </LotteryShell>
  );
}
