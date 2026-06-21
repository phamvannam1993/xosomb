import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="notFoundPage">
      <div className="notFoundContainer">
        <div className="notFoundContent">
          <div className="notFoundCode">404</div>
          
          <h1 className="notFoundTitle">Không tìm thấy trang</h1>
          
          <p className="notFoundMessage">
            Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            Nó có thể là một ngày chưa có kết quả quay hoặc URL không đúng.
          </p>

          <div className="notFoundActions">
            <Link href="/" className="notFoundButton notFoundButtonPrimary">
              Trang chủ
            </Link>
            <Link href="/xsmb" className="notFoundButton notFoundButtonSecondary">
              XSMB hôm nay
            </Link>
          </div>

          <div className="notFoundLinks">
            <h2>Các trang phổ biến:</h2>
            <ul>
              <li><Link href="/xsmb">Xổ số miền Bắc</Link></li>
              <li><Link href="/xsmn">Xổ số miền Nam</Link></li>
              <li><Link href="/xsmt">Xổ số miền Trung</Link></li>
              <li><Link href="/vietlott">Kết quả Vietlott</Link></li>
              <li><Link href="/xsmb-30-ngay">Sổ kết quả 30 ngày</Link></li>
              <li><Link href="/lich-mo-thuong">Lịch mở thưởng</Link></li>
              <li><Link href="/thong-ke">Thống kê tham khảo</Link></li>
            </ul>
          </div>

          <div className="notFoundInfo">
            <p>
              💡 <strong>Mẹo:</strong> Nếu bạn đang tìm kết quả xổ số của một ngày cụ thể, hãy sử dụng công cụ 
              <Link href="/xsmb"> Tra cứu theo ngày</Link> để tìm kết quả.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
