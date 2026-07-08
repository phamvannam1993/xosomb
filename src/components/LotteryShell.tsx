import Link from 'next/link';
import type { ReactNode } from 'react';
import { getSourcesByRegion } from '@/lib/lottery/catalog';

const statsUtilities = [
  { label: 'Thống kê 2 số cuối giải ĐB', href: '/thong-ke' },
  { label: 'Thống kê lô tô gan MB', href: '/thong-ke' },
  { label: 'Thống kê đầu đuôi lô tô miền Bắc', href: '/xsmb-30-ngay' },
  { label: 'Thống kê tần suất lô tô miền Bắc', href: '/thong-ke-tan-suat-lo-to-mien-bac.html' },
  { label: 'Cách dùng mã nhúng hiển thị kết quả xổ số', href: '/nguon-du-lieu' }
];

const vietlottLinks = [
  { label: 'Vietlott', href: '/vietlott' },
  { label: 'Mega 645', href: '/vietlott/mega-645' },
  { label: 'Power 655', href: '/vietlott/power-655' },
  { label: 'Max 3D', href: '/vietlott/max-3d' },
  { label: 'Max 3D Pro', href: '/vietlott/max-3d-pro' },
  { label: 'Keno', href: '/vietlott' }
];

const quickTools = [
  { label: 'Dò vé số online', href: '/do-ve-so' },
  { label: 'In vé dò', href: '/in-ve-do' },
  { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' },
  { label: 'Quay thử XSMB', href: '/quay-thu-xsmb', rel: 'nofollow' },
  { label: 'Quay thử XSMN', href: '/quay-thu-xsmn', rel: 'nofollow' },
  { label: 'Quay thử XSMT', href: '/quay-thu-xsmt', rel: 'nofollow' }
];

const infoLinks = [
  { label: 'Giới thiệu XoSoMB.vn', href: '/gioi-thieu' },
  { label: 'Nguồn dữ liệu xổ số', href: '/nguon-du-lieu' },
  { label: 'Chính sách cập nhật kết quả', href: '/chinh-sach-cap-nhat-ket-qua' },
  { label: 'Miễn trừ trách nhiệm', href: '/mien-tru-trach-nhiem' },
  { label: 'Liên hệ', href: '/lien-he' }
];

function SidebarSection({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  const content = href ? <Link href={href}>{title}</Link> : <span>{title}</span>;

  return (
    <section className="sidebarSection">
      <div className="nav-group-title">{content}</div>
      <div className="sidebarBody">{children}</div>
    </section>
  );
}

function ListLink({ href, label, badge, rel }: { href: string; label: string; badge?: string; rel?: string }) {
  return (
    <Link className="sideLink" href={href} rel={rel}>
      <span className="sideLinkText">
        <span className="sideBullet" aria-hidden="true" />
        <span>{label}</span>
      </span>
      {badge ? (
        <span className="sideDots" aria-label={badge}>
          <i className="is-active" />
          <i />
          <i />
        </span>
      ) : null}
    </Link>
  );
}

function LeftSidebar() {
  const south = getSourcesByRegion('south').filter((item) => item.code !== 'xsmn');
  const central = getSourcesByRegion('central').filter((item) => item.code !== 'xsmt');

  return (
    <aside className="leftColumn" aria-label="Danh mục xổ số">
      <SidebarSection title="Xổ số miền Bắc" href="/xsmb">
        <ListLink href="/xsmb" label="Miền Bắc" badge="Đang cập nhật" />
        <ListLink href="/xsmb-30-ngay" label="XSMB 30 ngày" />
        <ListLink href="/lich-mo-thuong" label="Lịch mở thưởng" />
      </SidebarSection>

      <SidebarSection title="Xổ số miền Nam" href="/xsmn">
        {south.map((province, index) => (
          <ListLink
            key={province.code}
            href={`/${province.code}`}
            label={province.name.replace(/^Xổ số\s+/i, '')}
            badge={index < 3 ? 'Đang cập nhật' : undefined}
          />
        ))}
      </SidebarSection>

      <SidebarSection title="Xổ số miền Trung" href="/xsmt">
        {central.map((province, index) => (
          <ListLink
            key={province.code}
            href={`/${province.code}`}
            label={province.name.replace(/^Xổ số\s+/i, '')}
            badge={index < 3 ? 'Đang cập nhật' : undefined}
          />
        ))}
      </SidebarSection>
    </aside>
  );
}

function RightSidebar() {
  return (
    <aside className="rightColumn" aria-label="Tiện ích tra cứu">
      <SidebarSection title="Xem thêm tiện ích thống kê" href="/thong-ke">
        {statsUtilities.map((item) => (
          <ListLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
        ))}
      </SidebarSection>

      <SidebarSection title="Xổ số Vietlott" href="/vietlott">
        {vietlottLinks.map((item) => (
          <ListLink key={item.label} href={item.href} label={item.label} />
        ))}
      </SidebarSection>

      <SidebarSection title="Công cụ xổ số">
        {quickTools.map((item) => (
          <ListLink key={item.label} href={item.href} label={item.label} rel={item.rel} />
        ))}
      </SidebarSection>

      <SidebarSection title="Thông tin website" href="/gioi-thieu">
        {infoLinks.map((item) => (
          <ListLink key={item.label} href={item.href} label={item.label} />
        ))}
      </SidebarSection>
    </aside>
  );
}

export function LotteryShell({ children }: { children: ReactNode }) {
  return (
    <div className="pageShell container">
      <div className="layoutGrid">
        <LeftSidebar />
        <main className="centerColumn">{children}</main>
        <RightSidebar />
      </div>
    </div>
  );
}
