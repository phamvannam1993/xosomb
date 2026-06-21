import type { Metadata } from 'next';
import Link from 'next/link';
import { DisclaimerBox } from '@/components/DisclaimerBox';
import { LotteryShell } from '@/components/LotteryShell';
import { MarketTabs } from '@/components/MarketTabs';
import { generateBreadcrumbListSchema } from '@/lib/metadata-utils';
import { absoluteUrl, siteConfig } from '@/lib/site';

function BreadcrumbListSchema({ schema }: { schema: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />;
}

const pageUrl = absoluteUrl('/mien-tru-trach-nhiem');

export const metadata: Metadata = {
  title: 'Miễn trừ trách nhiệm - XoSoMB.vn',
  description:
    'Thông tin miễn trừ trách nhiệm khi sử dụng XoSoMB.vn để tra cứu kết quả xổ số, dò vé số online và in phiếu dò kết quả.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: 'Miễn trừ trách nhiệm - XoSoMB.vn',
    description: 'XoSoMB.vn cung cấp dữ liệu tra cứu kết quả xổ số tham khảo, không bán vé và không nhận đặt cược.',
    siteName: siteConfig.name,
    locale: 'vi_VN'
  }
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Miễn trừ trách nhiệm',
  url: pageUrl,
  inLanguage: 'vi-VN',
  isPartOf: {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url
  }
};

export default function DisclaimerPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Miễn trừ trách nhiệm', path: '/mien-tru-trach-nhiem' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel trustHero">
          <p className="trustEyebrow">Điều khoản sử dụng nội dung</p>
          <h1>Miễn trừ trách nhiệm</h1>
          <p>
            XoSoMB.vn cung cấp thông tin kết quả xổ số để người dùng tra cứu tham khảo. Việc sử dụng dữ liệu trên website đồng nghĩa với việc người dùng hiểu và đồng ý với các lưu ý dưới đây.
          </p>
        </section>

        <section className="trustGrid" aria-label="Nội dung miễn trừ trách nhiệm">
          <article className="trustCard">
            <h2>Dữ liệu chỉ dùng để tra cứu</h2>
            <p>
              Kết quả, bảng lô tô, công cụ dò vé và phiếu in trên website chỉ có giá trị tham khảo. Khi cần xác nhận quyền lĩnh thưởng, người dùng cần đối chiếu với vé gốc và thông báo chính thức từ đơn vị phát hành.
            </p>
          </article>

          <article className="trustCard">
            <h2>Không bán vé, không đặt cược</h2>
            <p>
              XoSoMB.vn không bán vé số, không mua hộ vé, không đổi thưởng, không tổ chức cá cược và không nhận đặt cược dưới bất kỳ hình thức nào.
            </p>
          </article>

          <article className="trustCard">
            <h2>Không cam kết dự đoán</h2>
            <p>
              Các nội dung thống kê nếu có chỉ là tổng hợp dữ liệu quá khứ, không phải lời khuyên, dự đoán chắc chắn hoặc cam kết về kết quả trong tương lai.
            </p>
          </article>

          <article className="trustCard">
            <h2>Trách nhiệm của người dùng</h2>
            <p>
              Người dùng tự chịu trách nhiệm khi sử dụng thông tin để tra cứu, đối chiếu hoặc lưu trữ. Nếu phát hiện sai sót dữ liệu, vui lòng thông báo qua trang <Link href="/lien-he">liên hệ</Link> để website kiểm tra lại.
            </p>
          </article>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
