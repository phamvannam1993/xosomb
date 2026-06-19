import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
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
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  category: 'lottery results'
};

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'XSMB', href: '/xsmb' },
  { label: 'XSMN', href: '/xsmn' },
  { label: 'XSMT', href: '/xsmt' },
  { label: 'Sổ kết quả', href: '/xsmb-30-ngay' },
  { label: 'Thống kê', href: '/thong-ke' },
  { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' }
];

const footerColumns = [
  {
    title: 'Kết quả xổ số',
    links: [
      { label: 'Xổ số miền Bắc', href: '/xsmb' },
      { label: 'Xổ số miền Trung', href: '/xsmt' },
      { label: 'Xổ số miền Nam', href: '/xsmn' },
      { label: 'Xổ số Đồng Tháp', href: '/xsdt' },
      { label: 'Xổ số Bình Dương', href: '/xsbd' }
    ]
  },
  {
    title: 'Tiện ích',
    links: [
      { label: 'Sổ kết quả 30 ngày', href: '/xsmb-30-ngay' },
      { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' },
      { label: 'Tra cứu XSMB hôm nay', href: '/xsmb' }
    ]
  },
  {
    title: 'Hướng dẫn',
    links: [
      { label: 'Cách đọc bảng kết quả', href: '/xsmb' },
      { label: 'Bảng lô tô 2 số cuối', href: '/thong-ke' },
      { label: 'Tra cứu theo ngày', href: '/xsmb-30-ngay' }
    ]
  },
  {
    title: 'Thống kê',
    links: [
      { label: 'Thống kê tham khảo', href: '/thong-ke' },
      { label: 'XSMB 30 ngày', href: '/xsmb-30-ngay' },
      { label: 'Lịch quay theo miền', href: '/lich-mo-thuong' }
    ]
  }
];

const keywordLinks = [
  { label: 'xsmb', href: '/xsmb' },
  { label: 'xổ số miền Bắc', href: '/xsmb' },
  { label: 'kết quả xsmb', href: '/xsmb' },
  { label: 'xsmb 30 ngày', href: '/xsmb-30-ngay' },
  { label: 'lịch mở thưởng', href: '/lich-mo-thuong' }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: 'vi-VN',
  description: siteConfig.description
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body id="top">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0SJ6BCCVGN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0SJ6BCCVGN');
          `}
        </Script>

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
            <div className="container navInner">
              {navLinks.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </div>
          </nav>
        </header>

        {children}

        <footer className="siteFooter">
          <div className="container footerInner">
            <div className="footerTopGrid">
              {footerColumns.map((column) => (
                <section className="footerColumn" key={column.title}>
                  <h2>{column.title}</h2>
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

            <div className="footerKeywords" aria-label="Từ khóa tìm kiếm phổ biến">
              <span>Từ khóa tìm kiếm:</span>
              <div>
                {keywordLinks.map((item) => (
                  <Link href={item.href} key={item.label}>{item.label}</Link>
                ))}
              </div>
            </div>

            <div className="footerBottom">
              <div className="footerAbout">
                <p><strong>{siteConfig.domain}</strong> - Trang tra cứu kết quả xổ số miền Bắc và kết quả xổ số theo tỉnh.</p>
                <p>Dữ liệu được trình bày để tham khảo, cập nhật thường xuyên và hỗ trợ người dùng xem lại kết quả theo ngày.</p>
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
      </body>
    </html>
  );
}
