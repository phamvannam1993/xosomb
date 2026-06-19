import Link from 'next/link';

export function MarketTabs() {
  return (
    <section className="marketTabs" aria-label="Nhóm kết quả xổ số nhanh">
      <div className="tabHeader">
        <Link href="/xsmb">KQXSMB</Link>
        <Link href="/xsmn">KQXSMN</Link>
        <Link href="/xsmt">KQXSMT</Link>
      </div>
      <div className="miniLinkGrid">
        <Link href="/xsmb">XSMB hôm nay</Link>
        <Link href="/xsmb-30-ngay">XSMB 30 ngày</Link>
        <Link href="/lich-mo-thuong">Lịch mở thưởng</Link>
        <Link href="/thong-ke">Thống kê tham khảo</Link>
      </div>
    </section>
  );
}
