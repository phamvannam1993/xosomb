import Link from 'next/link';

export function MarketTabs() {
  return (
    <section className="marketTabs" aria-label="Nhóm kết quả xổ số nhanh">
      <div className="tabHeader">
        <Link href="/xsmb">KQXSMB</Link>
        <Link href="/xsmn">KQXSMN</Link>
        <Link href="/xsmt">KQXSMT</Link>
        <Link href="/vietlott">Vietlott</Link>
      </div>
      <div className="miniLinkGrid">
        <Link href="/xsmb">XSMB hôm nay</Link>
        <Link href="/xsmb-30-ngay">XSMB 30 ngày</Link>
        <Link href="/lich-mo-thuong">Lịch mở thưởng</Link>
        <Link href="/vietlott/mega-645">Mega 6/45</Link>
        <Link href="/vietlott/power-655">Power 6/55</Link>
        <Link href="/thong-ke">Thống kê tham khảo</Link>
      </div>
    </section>
  );
}
