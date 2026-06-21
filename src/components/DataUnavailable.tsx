import Link from 'next/link';
import { todayInVietnam } from '@/lib/lottery/format';

type DataUnavailableProps = {
  title?: string;
  message?: string;
  headingLevel?: 1 | 2;
};

export function DataUnavailable({ title = 'Chưa có dữ liệu xổ số', message, headingLevel = 1 }: DataUnavailableProps) {
  const HeadingTag = headingLevel === 2 ? 'h2' : 'h1';

  return (
    <section className="contentPanel seoText">
      <HeadingTag>{title}</HeadingTag>
      <p>
        {message ||
          'Kết quả cho ngày này chưa sẵn sàng. Vui lòng chọn ngày khác hoặc quay lại sau khi dữ liệu được cập nhật.'}
      </p>
      <p>
        Có thể xem nhanh <Link href="/xsmb">XSMB hôm nay</Link> hoặc tra cứu theo ngày tại{' '}
        <Link href={`/xsmb/${todayInVietnam()}`}>trang kết quả mới nhất</Link>.
      </p>
    </section>
  );
}
