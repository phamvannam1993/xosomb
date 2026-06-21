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
LOTTERY_PROVIDER=rss
LOTTERY_ALLOW_MOCK_FALLBACK=false
LOTTERY_FILE_CACHE=true
LOTTERY_REVALIDATE_SECONDS=60
XSMB_RSS_URL=https://xskt.com.vn/rss-feed/mien-bac-xsmb.rss
XSMB_RSS_SOURCE_NAME=XSKT RSS
```

Nếu muốn RSS là nguồn chính nhưng vẫn fallback HTML/API khi RSS chậm, dùng `LOTTERY_PROVIDER=auto`. Không nên để trùng 2 dòng `LOTTERY_PROVIDER` trong cùng một file `.env`.

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
