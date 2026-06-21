import type { Metadata } from 'next';
import Link from 'next/link';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { getAllLotterySources } from '@/lib/lottery/catalog';
import { todayInVietnam } from '@/lib/lottery/format';
import { absoluteUrl } from '@/lib/site';
import InVeDoClient from './InVeDoClient';

export const metadata: Metadata = {
  title: 'In vé dò kết quả xổ số - In phiếu dò vé số online',
  description:
    'In vé dò kết quả xổ số theo tỉnh và ngày quay. Tạo phiếu dò vé số online khổ A4, A5 hoặc K80, hỗ trợ bảng kết quả và lô tô đầu đuôi.',
  alternates: { canonical: absoluteUrl('/in-ve-do') }
};

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'In vé dò kết quả xổ số XoSoMB.vn',
  url: absoluteUrl('/in-ve-do'),
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web',
  inLanguage: 'vi-VN',
  description:
    'Công cụ tạo phiếu dò kết quả xổ số theo tỉnh và ngày quay, hỗ trợ khổ A4, A5 và máy in nhiệt K80.'
};

export default function InVeDoPage() {
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
    { name: 'In vé dò', path: '/in-ve-do' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel toolIntro">
          <h1>In vé dò kết quả xổ số</h1>
          <p>
            Tạo phiếu dò kết quả xổ số để in ra giấy theo tỉnh, miền và ngày quay. Công cụ hỗ trợ bản in A4, A5
            và K80 cho máy in nhiệt, phù hợp khi cần dò vé nhanh hoặc lưu kết quả trong ngày.
          </p>
          <p>
            Phiếu in có bảng kết quả đầy đủ, bảng lô tô 2 số cuối, thời điểm kiểm tra dữ liệu và đường dẫn đối chiếu
            trên XoSoMB.vn. Nếu muốn nhập số vé để kiểm tra trực tiếp, dùng thêm <Link href="/do-ve-so">Dò vé số online</Link>.
          </p>
        </section>

        <InVeDoClient sources={sources} today={todayInVietnam()} />

        <section className="contentPanel seoText">
          <h2>Cách in phiếu dò vé số</h2>
          <p>
            Chọn tỉnh hoặc miền, chọn ngày xổ, chọn khổ giấy rồi bấm “Xem trước & In phiếu dò”. Trình duyệt sẽ mở
            bản xem trước để anh kiểm tra nội dung trước khi in hoặc lưu thành PDF.
          </p>
          <h2>Nên chọn khổ in nào?</h2>
          <p>
            A4 phù hợp để in bảng lớn, A5 phù hợp in gọn và K80 phù hợp máy in nhiệt 80mm. Với máy in nhiệt, nên chọn
            khổ K80 để chữ không bị nhỏ và bố cục không bị tràn giấy.
          </p>
          <h2>Phiếu dò có phải vé số không?</h2>
          <p>
            Không. Phiếu dò kết quả chỉ là bản in để tra cứu và đối chiếu kết quả, không phải vé số, không thay thế vé
            số gốc và không có giá trị lĩnh thưởng.
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
