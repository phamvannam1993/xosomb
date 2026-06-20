import type { Metadata } from 'next';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { absoluteUrl } from '@/lib/site';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

export const metadata: Metadata = {
  title: 'Lịch mở thưởng xổ số ba miền',
  description: 'Lịch mở thưởng tham khảo cho xổ số miền Bắc, miền Nam và miền Trung. Nội dung phục vụ tra cứu thông tin.',
  alternates: {
    canonical: absoluteUrl('/lich-mo-thuong')
  }
};

const scheduleRows = [
  { name: 'Xổ số miền Bắc', time: 'Khoảng 18:00 - 18:30', days: 'Hằng ngày' },
  { name: 'Xổ số miền Nam', time: 'Khoảng 16:10', days: 'Hằng ngày theo lịch từng tỉnh' },
  { name: 'Xổ số miền Trung', time: 'Khoảng 17:15', days: 'Hằng ngày theo lịch từng tỉnh' }
];

export default function SchedulePage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Lịch mở thưởng', path: '/lich-mo-thuong' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <LotteryShell>
        <MarketTabs />
      <section className="contentPanel">
        <h1>Lịch mở thưởng xổ số</h1>
        <p className="panelLead">Bảng lịch mở thưởng tham khảo theo từng miền. Khi đối chiếu vé số, nên kiểm tra thêm thông báo từ đơn vị phát hành.</p>
        <table className="infoTable">
          <tbody>
            <tr>
              <th>Khu vực</th>
              <th>Thời gian</th>
              <th>Lịch quay</th>
            </tr>
            {scheduleRows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.time}</td>
                <td>{row.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
