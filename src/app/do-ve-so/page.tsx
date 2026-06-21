import type { Metadata } from 'next';
import Link from 'next/link';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getAllLotterySources } from '@/lib/lottery/catalog';
import { todayInVietnam } from '@/lib/lottery/format';
import { absoluteUrl } from '@/lib/site';
import DoVeSoClient from './DoVeSoClient';

export const metadata: Metadata = {
  title: 'Dò vé số online - Kiểm tra vé số trúng thưởng nhanh',
  description:
    'Dò vé số online theo tỉnh và ngày quay. Nhập số trên vé để kiểm tra kết quả khớp giải đặc biệt, giải nhất, giải nhì và các giải xổ số mới nhất.',
  alternates: { canonical: absoluteUrl('/do-ve-so') }
};

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Dò vé số online XoSoMB.vn',
  url: absoluteUrl('/do-ve-so'),
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web',
  inLanguage: 'vi-VN',
  description:
    'Công cụ dò vé số online theo tỉnh và ngày quay, hỗ trợ kiểm tra số vé khớp với bảng kết quả xổ số đã công bố.'
};

export default function DoVeSoPage() {
  const sources = getAllLotterySources()
    .filter((source) => source.region === 'north' || source.region === 'south' || source.region === 'central')
    .map((source) => ({
      code: source.code,
      shortName: source.shortName,
      name: source.name,
      region: source.region
    }));

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Dò vé số online', path: '/do-ve-so' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel toolIntro">
          <h1>Dò vé số online</h1>
          <p>
            Chọn tỉnh hoặc miền, chọn ngày quay rồi nhập số trên vé để đối chiếu với kết quả xổ số đã công bố.
            Công cụ hỗ trợ dò một vé hoặc nhiều vé cùng lúc, không tạo URL riêng theo số vé.
          </p>
          <p>
            Sau khi dò xong, anh có thể mở ngay bảng kết quả gốc để kiểm tra lại các giải. Dữ liệu chỉ phục vụ tra cứu
            tham khảo, <Link href="/lich-mo-thuong">xem lịch mở thưởng</Link> nếu cần chọn đúng ngày quay.
          </p>
        </section>

        <DoVeSoClient sources={sources} today={todayInVietnam()} />

        <section className="contentPanel seoText">
          <h2>Cách dò vé số online</h2>
          <p>
            Nhập đủ 5 hoặc 6 chữ số trên vé, hệ thống sẽ so khớp phần đuôi số với từng giải trong bảng kết quả của tỉnh
            và ngày đã chọn. Nếu số vé khớp với một hoặc nhiều giải, kết quả sẽ hiển thị tên giải, số trúng và số chữ số khớp.
          </p>
          <p>
            Công cụ này không lưu số vé của người dùng thành trang công khai và không dùng để dự đoán kết quả. Anh có thể
            tra cứu thêm <Link href="/xsmb">XSMB hôm nay</Link>, <Link href="/xsmn">XSMN hôm nay</Link> hoặc <Link href="/xsmt">XSMT hôm nay</Link>.
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
