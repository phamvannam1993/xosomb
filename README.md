# XoSoMB.vn Next.js

Bộ code Next.js App Router cho website tra cứu kết quả xổ số theo hướng SEO sạch: render nội dung từ server, có cache dữ liệu, canonical/sitemap/robots và giao diện nhẹ, dễ crawl.

## Chức năng chính

- Trang chủ hiển thị XSMB hôm nay.
- Trang `/xsmb`, `/xsmn`, `/xsmt` và các trang tỉnh như `/xsdt`, `/xsbd`, `/xscm`.
- Trang ngày chi tiết: `/{code}/YYYY-MM-DD`.
- Sổ kết quả `/xsmb-30-ngay`.
- Thống kê tham khảo `/thong-ke`.
- Lịch mở thưởng `/lich-mo-thuong`.
- API nội bộ `/api/lottery` đã gắn `X-Robots-Tag: noindex, nofollow` và bị chặn trong `robots.txt`.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

## Cấu hình production khuyến nghị

```env
NEXT_PUBLIC_SITE_URL=https://xosomb.vn
LOTTERY_PROVIDER=auto
LOTTERY_ALLOW_MOCK_FALLBACK=false
LOTTERY_FILE_CACHE=true
LOTTERY_REVALIDATE_SECONDS=60
```

Khi cập nhật từ bản cũ, nên xóa cache cũ:

```bash
rm -rf .cache
npm run dev
```

## Ghi chú SEO

- Không hiển thị mô tả kỹ thuật như API/RSS/HTML/cache trên giao diện public.
- Không index API nội bộ.
- Trang chưa có dữ liệu sẽ `noindex, follow` để tránh index nội dung rỗng.
- Sitemap chỉ đưa các trang chính và trang ngày đã có dữ liệu.
- Nội dung tập trung vào tra cứu kết quả, sổ kết quả, lịch mở thưởng và thống kê tham khảo.

## Quay thử + realtime

Các trang `/quay-thu-xsmb`, `/quay-thu-xsmn`, `/quay-thu-xsmt` đã được xử lý theo dạng hybrid:

- Khi bấm **Bắt đầu quay**, frontend gọi realtime API:

```txt
/api/lottery?code=xsmb&date=YYYY-MM-DD&live=1
```

- Ô nào nguồn dữ liệu đã có kết quả thật thì hiển thị ngay.
- Ô nào chưa có dữ liệu thì quay mô phỏng từng ô.
- Giải đặc biệt được giữ trả cuối cùng.
- Nếu nguồn realtime trả đủ bảng giải, hệ thống dừng quay và hiển thị kết quả thật đầy đủ.
- API realtime trả `Cache-Control: no-store` và `X-Robots-Tag: noindex, nofollow`.

Nếu muốn API realtime bên ngoài trả dữ liệu từng phần, format nên giống `LotteryResult`, trong đó `prizes` có thể chưa đủ toàn bộ giải.
