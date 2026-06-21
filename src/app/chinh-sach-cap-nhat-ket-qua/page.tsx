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

const pageUrl = absoluteUrl('/chinh-sach-cap-nhat-ket-qua');

export const metadata: Metadata = {
  title: 'Chính sách cập nhật kết quả xổ số - XoSoMB.vn',
  description:
    'Chính sách cập nhật kết quả xổ số trên XoSoMB.vn: thời gian cập nhật, xử lý dữ liệu đang quay, dữ liệu cache và cách kiểm tra kết quả.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: 'Chính sách cập nhật kết quả xổ số - XoSoMB.vn',
    description: 'Thông tin về cách XoSoMB.vn cập nhật, kiểm tra và hiển thị kết quả xổ số theo từng miền, tỉnh và ngày.',
    siteName: siteConfig.name,
    locale: 'vi_VN'
  }
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Chính sách cập nhật kết quả xổ số',
  url: pageUrl,
  inLanguage: 'vi-VN',
  isPartOf: {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url
  }
};

export default function UpdatePolicyPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Chính sách cập nhật kết quả', path: '/chinh-sach-cap-nhat-ket-qua' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel trustHero">
          <p className="trustEyebrow">Cập nhật kết quả</p>
          <h1>Chính sách cập nhật kết quả xổ số</h1>
          <p>
            XoSoMB.vn cập nhật kết quả theo từng kỳ quay, ưu tiên hiển thị dữ liệu rõ ràng, có kiểm tra định dạng và tránh sinh các trang không có dữ liệu thật.
          </p>
        </section>

        <section className="trustGrid" aria-label="Chính sách cập nhật dữ liệu">
          <article className="trustCard">
            <h2>Thời điểm cập nhật tham khảo</h2>
            <ul className="trustList">
              <li>Xổ số miền Nam: khoảng 16:10 hằng ngày theo lịch tỉnh.</li>
              <li>Xổ số miền Trung: khoảng 17:15 hằng ngày theo lịch tỉnh.</li>
              <li>Xổ số miền Bắc: khoảng 18:15 hằng ngày.</li>
              <li>Vietlott: cập nhật theo từng sản phẩm và lịch quay tương ứng.</li>
            </ul>
          </article>

          <article className="trustCard">
            <h2>Khi đang quay số</h2>
            <p>
              Trong khung giờ quay, hệ thống có thể hiển thị dữ liệu từng phần ngay trong bảng kết quả. Giải nào có dữ liệu sẽ được hiển thị trước; giải chưa có dữ liệu có thể ở trạng thái đang chờ hoặc đang quay.
            </p>
          </article>

          <article className="trustCard">
            <h2>Khi chưa có kết quả mới</h2>
            <p>
              Với các tỉnh không quay trong ngày, trang tỉnh có thể hiển thị kết quả mới nhất thay vì ghi “hôm nay”. Các trang chi tiết theo ngày chỉ được hiển thị khi có dữ liệu hợp lệ cho ngày đó.
            </p>
          </article>

          <article className="trustCard">
            <h2>Khi dữ liệu có sai lệch</h2>
            <p>
              Nếu phát hiện dữ liệu chưa đúng, hệ thống sẽ ưu tiên kiểm tra lại nguồn, cập nhật cache và không đưa URL lỗi vào sitemap. Người dùng có thể gửi góp ý qua trang <Link href="/lien-he">liên hệ</Link>.
            </p>
          </article>
        </section>

        <section className="contentPanel seoText">
          <h2>Khuyến nghị khi tra cứu</h2>
          <p>
            Để đối chiếu nhanh, có thể dùng <Link href="/do-ve-so">dò vé số online</Link> hoặc <Link href="/in-ve-do">in phiếu dò</Link>. Khi cần lĩnh thưởng, nên kiểm tra thêm với vé gốc và thông báo từ đơn vị phát hành.
          </p>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
