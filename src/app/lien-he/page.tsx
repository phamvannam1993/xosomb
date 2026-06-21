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

const pageUrl = absoluteUrl('/lien-he');
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || `contact@${siteConfig.domain}`;

export const metadata: Metadata = {
  title: 'Liên hệ XoSoMB.vn',
  description:
    'Liên hệ XoSoMB.vn để góp ý dữ liệu kết quả xổ số, báo lỗi hiển thị, đề xuất hợp tác hoặc phản hồi về công cụ dò vé số và in vé dò.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: 'Liên hệ XoSoMB.vn',
    description: 'Gửi góp ý, báo lỗi dữ liệu hoặc liên hệ hỗ trợ liên quan tới XoSoMB.vn.',
    siteName: siteConfig.name,
    locale: 'vi_VN'
  }
};

const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Liên hệ XoSoMB.vn',
  url: pageUrl,
  inLanguage: 'vi-VN',
  isPartOf: {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: contactEmail,
    availableLanguage: ['vi']
  }
};

export default function ContactPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Trang chủ', path: '/' },
    { name: 'Liên hệ', path: '/lien-he' }
  ]);

  return (
    <>
      <BreadcrumbListSchema schema={breadcrumbSchema} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <LotteryShell>
        <MarketTabs />

        <section className="contentPanel trustHero">
          <p className="trustEyebrow">Hỗ trợ và góp ý</p>
          <h1>Liên hệ XoSoMB.vn</h1>
          <p>
            Nếu cần báo lỗi kết quả, góp ý giao diện, đề xuất nguồn dữ liệu hoặc trao đổi hợp tác, vui lòng liên hệ với đội ngũ quản trị XoSoMB.vn.
          </p>
        </section>

        <section className="contactGrid" aria-label="Thông tin liên hệ">
          <article className="trustCard contactCard">
            <h2>Email liên hệ</h2>
            <p>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>
          </article>

          <article className="trustCard contactCard">
            <h2>Nội dung nên gửi kèm</h2>
            <ul className="trustList">
              <li>URL trang cần kiểm tra.</li>
              <li>Mã tỉnh/miền và ngày kết quả liên quan.</li>
              <li>Ảnh chụp màn hình nếu có lỗi hiển thị.</li>
              <li>Mô tả ngắn vấn đề cần phản hồi.</li>
            </ul>
          </article>
        </section>

        <section className="trustGrid" aria-label="Chủ đề liên hệ thường gặp">
          <article className="trustCard">
            <h2>Báo lỗi dữ liệu</h2>
            <p>
              Nếu thấy kết quả, bảng lô tô hoặc ngày quay chưa khớp, hãy gửi URL cụ thể để hệ thống kiểm tra lại cache và nguồn dữ liệu.
            </p>
          </article>

          <article className="trustCard">
            <h2>Góp ý tính năng</h2>
            <p>
              Website đang hỗ trợ <Link href="/do-ve-so">dò vé số online</Link>, <Link href="/in-ve-do">in vé dò</Link>, lịch mở thưởng và sổ kết quả. Góp ý cải thiện trải nghiệm luôn được ghi nhận.
            </p>
          </article>

          <article className="trustCard">
            <h2>Hợp tác nội dung</h2>
            <p>
              Có thể liên hệ nếu cần trao đổi về dữ liệu, widget tra cứu, liên kết tham khảo hoặc các tiện ích phục vụ người dùng xổ số hợp pháp.
            </p>
          </article>

          <article className="trustCard">
            <h2>Không hỗ trợ mua vé/đặt cược</h2>
            <p>
              XoSoMB.vn không hỗ trợ mua vé, đổi thưởng, đặt cược hay các nội dung liên quan tới lô đề/cá cược dưới mọi hình thức.
            </p>
          </article>
        </section>

        <DisclaimerBox />
      </LotteryShell>
    </>
  );
}
