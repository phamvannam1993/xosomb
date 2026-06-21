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

const pageUrl = absoluteUrl('/gioi-thieu');

export const metadata: Metadata = {
  title: 'Giới thiệu XoSoMB.vn - Trang tra cứu kết quả xổ số',
  description:
    'Giới thiệu XoSoMB.vn, trang tra cứu kết quả xổ số theo miền, theo tỉnh, theo ngày; hỗ trợ dò vé số, in vé dò và xem lịch mở thưởng.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: 'Giới thiệu XoSoMB.vn',
    description:
      'XoSoMB.vn hỗ trợ tra cứu kết quả xổ số rõ ràng, nhanh, có công cụ dò vé số, in phiếu dò và lịch mở thưởng tham khảo.',
    siteName: siteConfig.name,
    locale: 'vi_VN'
  }
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Giới thiệu XoSoMB.vn',
  url: pageUrl,
  inLanguage: 'vi-VN',
  isPartOf: {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url
  },
  description:
    'Trang giới thiệu mục đích hoạt động của XoSoMB.vn và các công cụ tra cứu kết quả xổ số.'
};

export default function AboutPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Giới thiệu', path: '/gioi-thieu' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel trustHero">
          <p className="trustEyebrow">Về XoSoMB.vn</p>
          <h1>Giới thiệu XoSoMB.vn</h1>
          <p>
            XoSoMB.vn là website hỗ trợ tra cứu kết quả xổ số theo miền, theo tỉnh và theo ngày. Nội dung được trình bày theo hướng nhanh, rõ ràng, dễ xem trên điện thoại và máy tính.
          </p>
        </section>

        <section className="trustGrid" aria-label="Thông tin giới thiệu">
          <article className="trustCard">
            <h2>XoSoMB.vn cung cấp gì?</h2>
            <ul className="trustList">
              <li>Kết quả xổ số miền Bắc, miền Nam, miền Trung và các tỉnh.</li>
              <li>Sổ kết quả theo ngày, bảng lô tô 2 số cuối và lịch mở thưởng.</li>
              <li>Công cụ <Link href="/do-ve-so">dò vé số online</Link> và <Link href="/in-ve-do">in phiếu dò kết quả</Link>.</li>
              <li>Kết quả Vietlott và các tiện ích tra cứu tham khảo.</li>
            </ul>
          </article>

          <article className="trustCard">
            <h2>Nguyên tắc hoạt động</h2>
            <p>
              Website ưu tiên tốc độ tải, dữ liệu rõ ràng, hạn chế thông tin gây nhiễu và không tạo các trang không có dữ liệu thật. Các URL ngày tương lai hoặc ngày không có kết quả hợp lệ sẽ không được hiển thị như trang kết quả chính thức.
            </p>
          </article>

          <article className="trustCard">
            <h2>Không phải đơn vị phát hành vé</h2>
            <p>
              XoSoMB.vn không phải website chính thức của hội đồng xổ số, không phát hành vé, không bán vé, không mua hộ vé và không nhận đặt cược. Người dùng nên đối chiếu thêm với thông báo từ đơn vị phát hành khi cần lĩnh thưởng.
            </p>
          </article>

          <article className="trustCard">
            <h2>Liên kết hữu ích</h2>
            <div className="trustLinkGrid">
              <Link href="/nguon-du-lieu">Nguồn dữ liệu</Link>
              <Link href="/chinh-sach-cap-nhat-ket-qua">Chính sách cập nhật</Link>
              <Link href="/mien-tru-trach-nhiem">Miễn trừ trách nhiệm</Link>
              <Link href="/lien-he">Liên hệ</Link>
            </div>
          </article>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
