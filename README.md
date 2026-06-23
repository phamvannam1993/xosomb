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
LOTTERY_LIVE_FAST_POLL_MS=5000
LOTTERY_LIVE_SLOW_POLL_MS=15000
LOTTERY_LIVE_UPSTREAM_CACHE_MS=2000
LOTTERY_RSS_TIMEOUT_MS=5000
LOTTERY_LIVE_HTML_TIMEOUT_MS=6000
XSMB_RSS_URL=https://xskt.com.vn/rss-feed/mien-bac-xsmb.rss
XSMB_RSS_SOURCE_NAME=XSKT RSS
```

`LOTTERY_PROVIDER=auto` là cấu hình khuyến nghị: phần live gọi song song RSS và API riêng (nếu có); nếu các nguồn chính chưa trả dữ liệu, hệ thống mới dùng trang trực tiếp/trang kết quả HTML làm nguồn dự phòng. Các request live dùng `no-store` và URL phá cache. Dữ liệu mock không được dùng để kết thúc một phiên live; mock chỉ chạy khi bạn chủ động đặt `LOTTERY_PROVIDER=mock`. Có thể dùng `LOTTERY_PROVIDER=rss` nếu chỉ muốn lấy RSS. Không nên để trùng hai dòng `LOTTERY_PROVIDER` trong cùng một file `.env`.

## Luồng live

- Client gọi `/api/lottery/live` theo chu kỳ, không gọi thẳng RSS nên tránh lỗi CORS. Trang mở trước giờ quay vẫn tự chuyển sang live khi bước vào khung tường thuật.
- Mỗi lần polling chỉ bắt đầu sau khi lần trước hoàn tất, tránh request chồng nhau.
- Snapshot từ RSS/API/HTML được gộp với dữ liệu đang hiển thị; một response tạm thời thiếu giải sẽ không làm mất các giải đã có. Các số trùng hợp lệ vẫn được giữ nguyên.
- Trước giờ quay chỉ hiển thị trạng thái chờ; hiệu ứng quay số bắt đầu khi đến giờ hoặc khi nguồn đã trả dữ liệu.
- Khi kết quả đủ toàn bộ giải, polling tự dừng và kết quả được ghi cache.

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
