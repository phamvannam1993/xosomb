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

const pageUrl = absoluteUrl('/nguon-du-lieu');

export const metadata: Metadata = {
  title: 'Nguồn dữ liệu kết quả xổ số - XoSoMB.vn',
  description:
    'Thông tin về cách XoSoMB.vn thu thập, chuẩn hóa, lưu cache và hiển thị dữ liệu kết quả xổ số phục vụ tra cứu tham khảo.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: 'Nguồn dữ liệu kết quả xổ số - XoSoMB.vn',
    description:
      'XoSoMB.vn tổng hợp dữ liệu kết quả xổ số từ các nguồn công khai/kỹ thuật được cấu hình, chuẩn hóa và hiển thị để người dùng tra cứu.',
    siteName: siteConfig.name,
    locale: 'vi_VN'
  }
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Nguồn dữ liệu kết quả xổ số',
  url: pageUrl,
  inLanguage: 'vi-VN',
  isPartOf: {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url
  }
};

export default function DataSourcePage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Nguồn dữ liệu', path: '/nguon-du-lieu' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel trustHero">
          <p className="trustEyebrow">Minh bạch dữ liệu</p>
          <h1>Nguồn dữ liệu kết quả xổ số</h1>
          <p>
            XoSoMB.vn tổng hợp kết quả xổ số từ các nguồn dữ liệu công khai hoặc nguồn kỹ thuật được cấu hình trong hệ thống. Dữ liệu được chuẩn hóa, kiểm tra định dạng và lưu cache để phục vụ tra cứu nhanh.
          </p>
        </section>

        <section className="trustGrid" aria-label="Cách xử lý dữ liệu xổ số">
          <article className="trustCard">
            <h2>Cách dữ liệu được lấy</h2>
            <p>
              Hệ thống có thể lấy dữ liệu qua RSS, HTML hoặc API tùy từng loại kết quả. Với XSMB, cấu hình triển khai có thể ưu tiên nguồn RSS realtime. Các nguồn này được dùng để hiển thị kết quả tham khảo cho người dùng.
            </p>
          </article>

          <article className="trustCard">
            <h2>Chuẩn hóa và kiểm tra</h2>
            <ul className="trustList">
              <li>Kiểm tra mã tỉnh/miền và định dạng ngày.</li>
              <li>Không hiển thị ngày tương lai như một kết quả hợp lệ.</li>
              <li>Chỉ đưa vào sitemap các URL dữ liệu có thật trong cache.</li>
              <li>Ưu tiên hiển thị kết quả mới nhất nếu tỉnh chưa có kỳ quay trong ngày.</li>
            </ul>
          </article>

          <article className="trustCard">
            <h2>Cache dữ liệu</h2>
            <p>
              Kết quả sau khi lấy và kiểm tra sẽ được lưu cache để tăng tốc độ tải trang. Nếu nguồn ngoài chậm hoặc tạm thời lỗi, website có thể dùng dữ liệu đã lưu gần nhất thay vì tạo trang rỗng hoặc dữ liệu không hợp lệ.
            </p>
          </article>

          <article className="trustCard">
            <h2>Đối chiếu khi cần lĩnh thưởng</h2>
            <p>
              Nội dung trên XoSoMB.vn chỉ phục vụ tra cứu. Khi cần xác nhận lĩnh thưởng, người dùng nên kiểm tra thêm trên vé, tại điểm bán hoặc thông báo từ đơn vị phát hành xổ số tương ứng.
            </p>
          </article>
        </section>

        <section className="contentPanel seoText">
          <h2>Trang liên quan</h2>
          <p>
            Xem thêm <Link href="/chinh-sach-cap-nhat-ket-qua">chính sách cập nhật kết quả</Link>, <Link href="/mien-tru-trach-nhiem">miễn trừ trách nhiệm</Link> và <Link href="/gioi-thieu">giới thiệu XoSoMB.vn</Link>.
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
