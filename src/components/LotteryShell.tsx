import Link from 'next/link';
import type { ReactNode } from 'react';
import { getSourcesByRegion } from '@/lib/lottery/catalog';

const dataUtilities = [
  { label: 'XSMB hôm nay', href: '/xsmb' },
  { label: 'XSMB 30 ngày', href: '/xsmb-30-ngay' },
  { label: 'Thống kê tham khảo', href: '/thong-ke' },
  { label: 'Lịch mở thưởng', href: '/lich-mo-thuong' }
];

const guideLinks = [
  { label: 'Cách đọc bảng kết quả', href: '/xsmb' },
  { label: 'Tra cứu theo ngày', href: '/xsmb-30-ngay' },
  { label: 'Lịch quay các miền', href: '/lich-mo-thuong' }
];

function SidebarSection({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  const content = href ? <Link href={href}>{title}</Link> : <span>{title}</span>;

  return (
    <section className="sidebarSection">
      <h2 className="sidebarTitle">{content}</h2>
      <div className="sidebarBody">{children}</div>
    </section>
  );
}

function ListLink({ href, label, badge, rel }: { href: string; label: string; badge?: string; rel?: string }) {
  return (
    <Link className="sideLink" href={href} rel={rel}>
      <span>{label}</span>
      {badge ? <em>{badge}</em> : null}
    </Link>
  );
}

function LeftSidebar() {
  const south = getSourcesByRegion('south').filter((item) => item.code !== 'xsmn');
  const central = getSourcesByRegion('central').filter((item) => item.code !== 'xsmt');

  return (
    <aside className="leftColumn" aria-label="Danh mục xổ số">
      <SidebarSection title="Xổ số miền Bắc" href="/xsmb">
        <ListLink href="/xsmb" label="Miền Bắc" badge="live" />
        <ListLink href="/xsmb-30-ngay" label="XSMB 30 ngày" />
        <ListLink href="/lich-mo-thuong" label="Lịch mở thưởng" />
      </SidebarSection>

      <SidebarSection title="Xổ số miền Nam" href="/xsmn">
        {south.slice(0, 20).map((province) => (
          <ListLink key={province.code} href={`/${province.code}`} label={province.name.replace(/^Xổ số\s+/i, '')} />
        ))}
      </SidebarSection>

      <SidebarSection title="Xổ số miền Trung" href="/xsmt">
        {central.slice(0, 16).map((province) => (
          <ListLink key={province.code} href={`/${province.code}`} label={province.name.replace(/^Xổ số\s+/i, '')} />
        ))}
      </SidebarSection>
    </aside>
  );
}

function RightSidebar() {
  return (
    <aside className="rightColumn" aria-label="Tiện ích tra cứu">
      <SidebarSection title="Xổ số hôm qua" href="/xsmb-30-ngay">
        <ListLink href="/xsmb-30-ngay" label="XSMB hôm qua" />
        <ListLink href="/xsmn" label="XSMN gần đây" />
        <ListLink href="/xsmt" label="XSMT gần đây" />
      </SidebarSection>

      <SidebarSection title="Công cụ tra cứu">
        {dataUtilities.map((item) => (
          <ListLink key={item.label} href={item.href} label={item.label} />
        ))}
      </SidebarSection>

      <SidebarSection title="Hướng dẫn nhanh">
        {guideLinks.map((item) => (
          <ListLink key={item.label} href={item.href} label={item.label} />
        ))}
      </SidebarSection>

      <section className="scheduleCard">
        <Link href="/lich-mo-thuong">Xem lịch mở thưởng</Link>
      </section>
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
