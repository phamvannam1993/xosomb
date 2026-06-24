# XoSoMB.vn Next.js

Bộ code Next.js App Router cho website tra cứu kết quả xổ số theo hướng SEO sạch: render nội dung từ server, cache dữ liệu, canonical non-www, sitemap/robots và giao diện nhẹ, dễ crawl.

## Chức năng chính

- Trang chủ hiển thị XSMB hôm nay.
- Trang `/xsmb`, `/xsmn`, `/xsmt` và các trang tỉnh như `/xsdt`, `/xsbd`, `/xscm`.
- Trang ngày chi tiết: `/{code}/YYYY-MM-DD`.
- Sổ kết quả `/xsmb-30-ngay`.
- Thống kê tham khảo `/thong-ke`.
- Lịch mở thưởng `/lich-mo-thuong`.
- API nội bộ `/api/lottery` đã gắn `X-Robots-Tag: noindex, nofollow` và bị chặn trong `robots.txt`.
- Có middleware/app redirect để gom `www.xosomb.vn` về `https://xosomb.vn` khi request đi qua Next.js.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

Nếu muốn canonical local khi dev, sửa riêng trong `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production vẫn tự chốt canonical về `https://xosomb.vn` để tránh copy nhầm `.env` làm sitemap/canonical thành localhost.

## Cấu hình production khuyến nghị

```env
NEXT_PUBLIC_SITE_URL=https://xosomb.vn
LOTTERY_PROVIDER=auto
LOTTERY_ALLOW_MOCK_FALLBACK=false
LOTTERY_FILE_CACHE=true
LOTTERY_REVALIDATE_SECONDS=60
LOTTERY_LIVE_START_BEFORE_MINUTES=10
LOTTERY_LIVE_END_AFTER_MINUTES=75
LOTTERY_LIVE_FAST_POLL_MS=5000
LOTTERY_LIVE_SLOW_POLL_MS=15000
LOTTERY_LIVE_UPSTREAM_CACHE_MS=2000
LOTTERY_RSS_TIMEOUT_MS=5000
LOTTERY_HTML_TIMEOUT_MS=6000
LOTTERY_LIVE_HTML_TIMEOUT_MS=6000
XSMB_RSS_URL=https://xskt.com.vn/rss-feed/mien-bac-xsmb.rss
XSMB_RSS_SOURCE_NAME=XSKT RSS
CACHE_WARM_SECRET=doi-chuoi-bi-mat-rieng
```

`LOTTERY_PROVIDER=auto` là cấu hình khuyến nghị: phần live gọi song song RSS và API riêng nếu có; nếu các nguồn chính chưa trả dữ liệu, hệ thống mới dùng trang trực tiếp/trang kết quả HTML làm nguồn dự phòng. Các request live dùng `no-store` và URL phá cache. Dữ liệu mock không được dùng để kết thúc một phiên live; mock chỉ chạy khi chủ động đặt `LOTTERY_PROVIDER=mock`.

## Nginx canonical non-www

File mẫu đã có tại:

```bash
deploy/nginx-xosomb.vn.conf
```

Mục tiêu redirect chuẩn:

```txt
http://xosomb.vn        -> https://xosomb.vn
http://www.xosomb.vn    -> https://xosomb.vn
https://www.xosomb.vn   -> https://xosomb.vn
https://xosomb.vn       -> 200 OK
```

Sau khi copy cấu hình Nginx, kiểm tra:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I http://xosomb.vn
curl -I http://www.xosomb.vn
curl -I https://www.xosomb.vn
curl -I https://xosomb.vn
```

## Luồng live

- Client gọi `/api/lottery/live` theo chu kỳ, không gọi thẳng RSS nên tránh lỗi CORS.
- Mỗi lần polling chỉ bắt đầu sau khi lần trước hoàn tất, tránh request chồng nhau.
- Snapshot từ RSS/API/HTML được gộp với dữ liệu đang hiển thị; một response tạm thời thiếu giải sẽ không làm mất các giải đã có.
- XSMB có thêm fallback đọc HTML live từ `xoso.com.vn`, nhưng dữ liệu vẫn được chuẩn hóa thành `LotteryLiveResult` trước khi trả về client.
- Trước giờ quay chỉ hiển thị trạng thái chờ; hiệu ứng quay số bắt đầu khi đến giờ hoặc khi nguồn đã trả dữ liệu.
- Khi kết quả đủ toàn bộ giải, kết quả được ghi cache.

Khi cập nhật từ bản cũ, nên xóa cache cũ:

```bash
rm -rf .cache
npm run build
pm2 restart xosomb
```


## Sửa hiển thị thời gian kết quả đầy đủ

Bản này đã sửa lỗi dòng thời gian kiểu:

```txt
Kết quả đầy đủ ngày 23/06/2026 · Dữ liệu kiểm tra lúc: 13:57:30 24/06/2026
```

Với kết quả đã đầy đủ, giao diện không lấy thời điểm server/cache kiểm tra lại làm thời điểm cập nhật nữa. Nếu `updatedAt` từ nguồn bị lệch ngày so với ngày quay, hệ thống tự quy về thời điểm hoàn tất kỳ quay theo miền:

- Miền Bắc: 18:45:00 cùng ngày quay
- Miền Nam: 16:45:00 cùng ngày quay
- Miền Trung: 17:45:00 cùng ngày quay

Ví dụ đúng sau sửa:

```txt
Kết quả đầy đủ ngày 23/06/2026 · Cập nhật lúc: 18:45:00 23/06/2026
```

## Ghi chú SEO

- Canonical, sitemap, robots và schema luôn ưu tiên `https://xosomb.vn`.
- Không hiển thị mô tả kỹ thuật như API/RSS/HTML/cache trên giao diện public.
- Không index API nội bộ.
- Trang chưa có dữ liệu sẽ `noindex, follow` để tránh index nội dung rỗng.
- Sitemap chỉ đưa các trang chính và trang ngày đã có dữ liệu.
- Nội dung tập trung vào tra cứu kết quả, sổ kết quả, lịch mở thưởng và thống kê tham khảo.

## Cập nhật giao diện menu/sidebar

- Rút gọn menu trên desktop: gom `In vé dò`, `Thống kê`, `Quay thử` vào nhóm `Tiện ích`.
- Đổi nhãn `Sổ kết quả` thành `Sổ KQ` để tiết kiệm chiều ngang nhưng vẫn giữ link SEO trong dropdown.
- Giảm chiều cao thanh menu, giảm padding/font dropdown để hiển thị gọn hơn.
- Thu gọn sidebar trái/phải từ 260px xuống 215px, giảm khoảng cách và padding các dòng link.
- Tăng container chính lên 1180px để khu vực kết quả ở giữa rộng hơn.
