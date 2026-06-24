import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { absoluteUrl, siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: 'XSMB hôm nay - Kết quả xổ số miền Bắc mới nhất | XoSoMB.vn',
    template: '%s | XoSoMB.vn'
  },
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl('/')
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }]
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'XSMB hôm nay - Kết quả xổ số miền Bắc mới nhất',
    description: siteConfig.description,
    locale: 'vi_VN'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XSMB hôm nay - Kết quả xổ số miền Bắc mới nhất',
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  category: 'lottery results'
};

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  {
    label: 'XSMB',
    href: '/xsmb',
    children: [
      { label: 'XSMB hôm nay', href: '/xsmb' },
      { label: 'XSMB 30 ngày', href: '/xsmb-30-ngay' },
      { label: 'Lịch mở thưởng miền Bắc', href: '/lich-mo-thuong' }
    ]
  },
  {
    label: 'XSMN',
    href: '/xsmn',
    children: [
      { label: 'KQXSMN hôm nay', href: '/xsmn' },
      { label: 'Xổ số Đồng Tháp', href: '/xsdt' },
      { label: 'Xổ số Bình Dương', href: '/xsbd' },
      { label: 'Xổ số Hồ Chí Minh', href: '/xshcm' }
    ]
  },
  {
    label: 'XSMT',
    href: '/xsmt',
    children: [
      { label: 'KQXSMT hôm nay', href: '/xsmt' },
      { label: 'Xổ số Đà Nẵng', href: '/xsdng' },
      { label: 'Xổ số Gia Lai', href: '/xsgl' },
      { label: 'Xổ số Ninh Thuận', href: '/xsnt' }
    ]
  },
  {
    label: 'Vietlott',
    href: '/vietlott',
    children: [
      { label: 'Xổ số Vietlott', href: '/vietlott' },
      { label: 'Mega 6/45', href: '/vietlott/mega-645' },
      { label: 'Power 6/55', href: '/vietlott/power-655' },
      { label: 'Max 3D', href: '/vietlott/max-3d' },
      { label: 'Max 3D Pro', href: '/vietlott/max-3d-pro' }
    ]
  },
  {
    label: 'Sổ KQ',
    href: '/xsmb-30-ngay',
    children: [
      { label: 'Sổ kết quả 30 ngày', href: '/xsmb-30-ngay' },
      { label: 'XSMB hôm nay', href: '/xsmb' },
      { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' },
      { label: 'Thống kê tham khảo', href: '/thong-ke' }
    ]
  },
  { label: 'Dò vé', href: '/do-ve-so' },
  {
    label: 'Tiện ích',
    href: '/in-ve-do',
    children: [
      { label: 'In vé dò', href: '/in-ve-do' },
      { label: 'Dò vé số online', href: '/do-ve-so' },
      { label: 'Thống kê tham khảo', href: '/thong-ke' },
      { label: 'Quay thử XSMB', href: '/quay-thu-xsmb' },
      { label: 'Quay thử XSMN', href: '/quay-thu-xsmn' },
      { label: 'Quay thử XSMT', href: '/quay-thu-xsmt' }
    ]
  },
  {
    label: 'Thông tin',
    href: '/gioi-thieu',
    children: [
      { label: 'Giới thiệu', href: '/gioi-thieu' },
      { label: 'Nguồn dữ liệu', href: '/nguon-du-lieu' },
      { label: 'Chính sách cập nhật', href: '/chinh-sach-cap-nhat-ket-qua' },
      { label: 'Miễn trừ trách nhiệm', href: '/mien-tru-trach-nhiem' },
      { label: 'Liên hệ', href: '/lien-he' }
    ]
  }
];

const footerColumns = [
  {
    title: 'Kết quả xổ số',
    links: [
      { label: 'Xổ số miền Bắc', href: '/xsmb' },
      { label: 'Xổ số miền Trung', href: '/xsmt' },
      { label: 'Xổ số miền Nam', href: '/xsmn' },
      { label: 'Xổ số Đồng Tháp', href: '/xsdt' },
      { label: 'Xổ số Bình Dương', href: '/xsbd' },
      { label: 'Kết quả Vietlott', href: '/vietlott' }
    ]
  },
  {
    title: 'Tiện ích',
    links: [
      { label: 'Sổ kết quả 30 ngày', href: '/xsmb-30-ngay' },
      { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' },
      { label: 'Dò vé số online', href: '/do-ve-so' },
      { label: 'In vé dò', href: '/in-ve-do' },
      { label: 'Tra cứu XSMB hôm nay', href: '/xsmb' },
      { label: 'Kết quả Vietlott', href: '/vietlott' }
    ]
  },
  {
    title: 'Hướng dẫn',
    links: [
      { label: 'Cách đọc bảng kết quả', href: '/xsmb' },
      { label: 'Dò vé số online', href: '/do-ve-so' },
      { label: 'In vé dò', href: '/in-ve-do' },
      { label: 'Nguồn dữ liệu', href: '/nguon-du-lieu' },
      { label: 'Chính sách cập nhật', href: '/chinh-sach-cap-nhat-ket-qua' },
      { label: 'Bảng lô tô 2 số cuối', href: '/thong-ke' },
      { label: 'Tra cứu theo ngày', href: '/xsmb-30-ngay' }
    ]
  },
  {
    title: 'Thông tin',
    links: [
      { label: 'Giới thiệu', href: '/gioi-thieu' },
      { label: 'Nguồn dữ liệu', href: '/nguon-du-lieu' },
      { label: 'Chính sách cập nhật', href: '/chinh-sach-cap-nhat-ket-qua' },
      { label: 'Miễn trừ trách nhiệm', href: '/mien-tru-trach-nhiem' },
      { label: 'Liên hệ', href: '/lien-he' },
      { label: 'Thống kê tham khảo', href: '/thong-ke' }
    ]
  }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: 'vi-VN',
      description: siteConfig.description
    },
    {
      '@type': 'Organization',
      '@id': `${siteConfig.url}#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl('/icon.svg'),
      description: siteConfig.description
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body id="top">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <header className="siteHeader">
          <div className="container headerInner">
            <Link href="/" className="logo" aria-label="XoSoMB.vn trang chủ">
              <span className="logoMark">MB</span>
              <span className="logoText">XoSoMB.vn</span>
            </Link>
            <div className="headerTitle">
              <p className="siteKicker">Tra cứu kết quả xổ số</p>
              <p className="siteTitle">XSMB hôm nay, sổ kết quả và lịch mở thưởng</p>
            </div>
            <div className="todayPill">Cập nhật hằng ngày</div>
          </div>
          <nav className="navBar" aria-label="Điều hướng chính">
            <div className="container">
              <ul className="navMenu">
                {navLinks.map((item) => (
                  <li className={`navItem ${item.children ? 'hasDropdown' : ''}`} key={item.href}>
                    <Link className="navLink" href={item.href}>
                      <span>{item.label}</span>
                      {item.children ? <span className="navCaret" aria-hidden="true">▾</span> : null}
                    </Link>
                    {item.children ? (
                      <ul className="navDropdown" aria-label={`${item.label} menu`}>
                        {item.children.map((child) => (
                          <li key={`${item.href}-${child.href}-${child.label}`}>
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </header>

        {children}

        <footer className="siteFooter">
          <div className="container footerInner">
            <div className="footerTopGrid">
              {footerColumns.map((column) => (
                <section className="footerColumn" key={column.title}>
                  <div className="footerColumnTitle">{column.title}</div>
                  <ul>
                    {column.links.map((item) => (
                      <li key={`${column.title}-${item.href}-${item.label}`}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="footerBottom">
              <div className="footerAbout">
                <p><strong>{siteConfig.domain}</strong> - Trang tra cứu kết quả xổ số miền Bắc và kết quả xổ số theo tỉnh.</p>
                <p>Dữ liệu được trình bày để tham khảo, cập nhật thường xuyên và hỗ trợ người dùng xem lại kết quả theo ngày.</p>
                <p>Website không bán vé, không mua hộ vé và không nhận đặt cược dưới mọi hình thức.</p>
              </div>

              <div className="footerRight">
                <div className="socialGroup" aria-label="Kênh liên hệ">
                  <span aria-hidden="true">f</span>
                  <span aria-hidden="true">✈</span>
                  <span aria-hidden="true">Zalo</span>
                </div>
                <p>Copyright © 2026 {siteConfig.domain}, All Rights Reserved</p>
              </div>
            </div>
          </div>
          <a href="#top" className="backToTop" aria-label="Lên đầu trang">⌃</a>
        </footer>

        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
