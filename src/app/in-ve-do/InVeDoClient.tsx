'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type SourceOption = {
  code: string;
  shortName: string;
  name: string;
  region: string;
};

type PrintSize = 'a4' | 'a5' | 'k80';

type Props = {
  sources: SourceOption[];
  today: string;
};

const regionLabels: Record<string, string> = {
  north: 'Miền Bắc',
  south: 'Miền Nam',
  central: 'Miền Trung'
};

const sizeOptions: Array<{ value: PrintSize; label: string; description: string }> = [
  { value: 'a4', label: 'A4', description: 'Bảng lớn, đủ kết quả và lô tô 2 số cuối' },
  { value: 'a5', label: 'A5', description: 'Gọn hơn, dễ in nhanh hoặc kẹp sổ' },
  { value: 'k80', label: 'K80', description: 'Máy in nhiệt 80mm, kiểu hóa đơn' }
];

function provinceName(name: string) {
  return name.replace(/^Xổ số\s+/i, '');
}

export default function InVeDoClient({ sources, today }: Props) {
  const [code, setCode] = useState('xsmb');
  const [date, setDate] = useState(today);
  const [size, setSize] = useState<PrintSize>('a4');

  const groupedSources = useMemo(() => {
    const groups = new Map<string, SourceOption[]>();
    for (const source of sources) {
      const region = source.region || 'other';
      const current = groups.get(region) || [];
      current.push(source);
      groups.set(region, current);
    }
    return Array.from(groups.entries());
  }, [sources]);

  const selectedSource = sources.find((source) => source.code === code) || sources[0];
  const printHref = `/in-ve-do/print?code=${encodeURIComponent(code)}&date=${encodeURIComponent(date)}&size=${encodeURIComponent(size)}`;

  return (
    <section className="printTool" aria-label="Công cụ in phiếu dò kết quả xổ số">
      <div className="printFormCard">
        <div className="printStepHeader">
          <span>1</span>
          <div>
            <h2>Chọn dữ liệu cần in</h2>
            <p>Chọn đúng tỉnh/miền, ngày xổ và khổ giấy trước khi mở bản in.</p>
          </div>
        </div>

        <div className="printFormGrid">
          <label>
            <span>Tỉnh / miền</span>
            <select value={code} onChange={(event) => setCode(event.target.value)}>
              {groupedSources.map(([region, options]) => (
                <optgroup key={region} label={regionLabels[region] || region}>
                  {options.map((source) => (
                    <option key={source.code} value={source.code}>
                      {source.shortName} - {provinceName(source.name)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label>
            <span>Ngày xổ</span>
            <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        <fieldset className="printSizeGroup">
          <legend>Chọn khổ in</legend>
          {sizeOptions.map((option) => (
            <label key={option.value} className={size === option.value ? 'selected' : ''}>
              <input
                type="radio"
                name="print-size"
                value={option.value}
                checked={size === option.value}
                onChange={() => setSize(option.value)}
              />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </label>
          ))}
        </fieldset>

        <div className="printActionRow">
          <Link className="printPrimaryButton" href={printHref} target="_blank" prefetch={false}>
            Xem trước & In phiếu dò
          </Link>
          <Link className="printSecondaryButton" href={code === 'xsmb' ? `/xsmb/${date}` : `/${code}/${date}`}>
            Xem bảng kết quả gốc
          </Link>
        </div>
      </div>

      <div className="printPreviewCards" aria-label="Mẫu phiếu in">
        <article>
          <strong>Phiếu A4</strong>
          <span>Bảng kết quả đầy đủ, lô tô 2 số cuối, link kiểm tra online và ghi chú dữ liệu tham khảo.</span>
        </article>
        <article>
          <strong>Phiếu A5</strong>
          <span>Bản rút gọn phù hợp in nhanh, vẫn giữ đủ giải và bảng lô tô cơ bản.</span>
        </article>
        <article>
          <strong>Phiếu K80</strong>
          <span>Dạng hóa đơn cho máy in nhiệt 80mm, chữ đậm, gọn, dễ dò vé tại quầy.</span>
        </article>
      </div>

      <div className="printNoteBox">
        <strong>Lưu ý:</strong> Phiếu dò chỉ dùng để tra cứu kết quả, không phải vé số và không có giá trị lĩnh thưởng.
        Dữ liệu đang chọn: <b>{selectedSource?.shortName}</b> ngày <b>{date}</b>.
      </div>
    </section>
  );
}
