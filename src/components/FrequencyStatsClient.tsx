'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { FrequencyStatType, FrequencyTableData } from '@/lib/lottery/frequency';
import { ALL_TWO_DIGITS, FREQUENCY_DAY_OPTIONS } from '@/lib/lottery/frequency';

type Props = {
  table: FrequencyTableData;
  selectedDigits: string[];
  numOfDay: number;
  statType: FrequencyStatType;
};

function digitRows() {
  return Array.from({ length: 10 }, (_, head) =>
    Array.from({ length: 10 }, (_, tail) => `${head}${tail}`)
  );
}

function setFromDigits(digits: string[]) {
  return new Set(digits.filter((digit) => /^\d{2}$/.test(digit)));
}

export function FrequencyStatsClient({ table, selectedDigits, numOfDay, statType }: Props) {
  const [checkedDigits, setCheckedDigits] = useState(() => setFromDigits(selectedDigits));
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const rows = useMemo(() => digitRows(), []);

  function updateDigits(nextDigits: Iterable<string>) {
    setCheckedDigits(setFromDigits(Array.from(nextDigits)));
  }

  function toggleDigit(digit: string, checked: boolean) {
    setCheckedDigits((current) => {
      const next = new Set(current);
      if (checked) next.add(digit);
      else next.delete(digit);
      return next;
    });
  }

  function selectHead(head: number) {
    updateDigits(ALL_TWO_DIGITS.filter((digit) => digit.startsWith(String(head))));
  }

  function selectTail(tail: number) {
    updateDigits(ALL_TWO_DIGITS.filter((digit) => digit.endsWith(String(tail))));
  }

  function checkedCount() {
    return checkedDigits.size;
  }

  const visibleRows = table.rows;

  return (
    <section className="frequencyPage">
      <div className="azLikeBox frequencyFilterBox">
        <h1 className="title-bor">Thống kê tần suất lô tô miền Bắc</h1>

        <form className="frequencyForm" action="/thong-ke-tan-suat-lo-to-mien-bac.html" method="get">
          <input type="hidden" name="selection" value="1" />
          <div className="statistic-menu">
            <label className="frequencyField">
              <span>Tỉnh:</span>
              <select name="provinceId" defaultValue="1">
                <option value="1">Miền Bắc</option>
              </select>
            </label>

            <label className="frequencyField">
              <span>Số ngày:</span>
              <select name="numOfDay" defaultValue={numOfDay}>
                {FREQUENCY_DAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} lần mở thưởng gần đây</option>
                ))}
              </select>
            </label>

            <label className="frequencyField">
              <span>Loại:</span>
              <select name="type" defaultValue={statType}>
                <option value="0">Lô tô</option>
                <option value="1">Đặc biệt</option>
              </select>
            </label>

            <button className="frequencySubmit" type="submit">Xem kết quả</button>
          </div>

          <div className="provinceQuickLinks" aria-label="Liên kết thống kê nhanh">
            <span>Xem thêm: </span>
            <Link href="/thong-ke">Thống kê nhanh</Link>
            <Link href="/xsmb-30-ngay">XSMB 30 ngày</Link>
            <Link href="/xsmb">XSMB hôm nay</Link>
          </div>

          <div className="freq-stat-num">
            <div className="radio-button-menu">
              <button type="button" onClick={() => updateDigits(ALL_TWO_DIGITS)}>Tất cả</button>
              <button type="button" onClick={() => updateDigits([])}>Xóa tất cả</button>
              <button type="button" onClick={() => updateDigits(ALL_TWO_DIGITS.filter((digit) => Number(digit) % 2 === 0))}>Số chẵn</button>
              <button type="button" onClick={() => updateDigits(ALL_TWO_DIGITS.filter((digit) => Number(digit) % 2 === 1))}>Số lẻ</button>
              <span className="checkedStatus">Đang chọn {checkedCount()}/100 số</span>
            </div>

            <div className="numberMatrix" role="group" aria-label="Chọn bộ số từ 00 đến 99">
              {rows.map((digitRow, headIndex) => (
                <div className="numberMatrixRow" key={`head-${headIndex}`}>
                  {digitRow.map((digit) => (
                    <label className="number-checkbox" key={digit}>
                      <span>{digit}</span>
                      <input
                        type="checkbox"
                        name="boso"
                        value={digit}
                        checked={checkedDigits.has(digit)}
                        onChange={(event) => toggleDigit(digit, event.target.checked)}
                      />
                    </label>
                  ))}
                  <button type="button" className="btn-white-round" onClick={() => selectHead(headIndex)}>Đầu {headIndex}</button>
                </div>
              ))}

              <div className="numberMatrixRow tailRow">
                {Array.from({ length: 10 }, (_, index) => (
                  <button type="button" className="btn-white-round" key={`tail-${index}`} onClick={() => selectTail(index)}>
                    Đuôi {index}
                  </button>
                ))}
                <span className="tailSpacer" />
              </div>
            </div>
          </div>
        </form>

        <div className="frequencyGuide">
          <strong>HƯỚNG DẪN:</strong> Số lần xuất hiện màu đỏ là trường hợp bộ số về ở giải đặc biệt. Vuốt ngang bảng để xem thêm dữ liệu.
        </div>
      </div>

      <div className="azLikeBox tk-tansuat">
        <h2 className="tit-mien">{table.title}</h2>
        <div className="tansuat-selection">
          <label>
            <input
              type="radio"
              name="direction_radio"
              checked={direction === 'vertical'}
              onChange={() => setDirection('vertical')}
            />
            Xem chiều dọc
          </label>
          <label>
            <input
              type="radio"
              name="direction_radio"
              checked={direction === 'horizontal'}
              onChange={() => setDirection('horizontal')}
            />
            Xem chiều ngang
          </label>
          <span className="frequencySource">Nguồn: {table.source === 'az24-html' ? 'HTML thống kê' : 'dữ liệu nội bộ'}</span>
        </div>

        {table.note ? <p className="frequencyNote">{table.note}</p> : null}

        {direction === 'vertical' ? (
          <div className="freq-loto-table">
            <table className="frequencyMatrixTable">
              <thead>
                <tr>
                  <th>Ngày<br />Tháng<br />Năm</th>
                  {table.columns.map((column) => (
                    <th key={column.date} title={column.label}>{column.day}<br />{column.month}<br />{column.year}</th>
                  ))}
                  <th>Số<br />lần<br />về</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.digit}>
                    <td className="info">{row.digit}</td>
                    {row.cells.map((cell, index) => (
                      <td
                        className={`freqCell ${cell.count ? 'hasCount' : ''} ${cell.isSpecial ? 'isSpecial' : ''}`}
                        key={`${row.digit}-${table.columns[index]?.date || index}`}
                        title={cell.title}
                      >
                        {cell.count || ''}
                      </td>
                    ))}
                    <td className="bg_note">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="freq-loto-table">
            <table className="frequencyMatrixTable frequencyMatrixTableHorizontal">
              <thead>
                <tr>
                  <th>Ngày</th>
                  {visibleRows.map((row) => <th key={row.digit}>{row.digit}</th>)}
                </tr>
              </thead>
              <tbody>
                {table.columns.map((column, columnIndex) => (
                  <tr key={column.date}>
                    <td className="info dateInfo">{column.label}</td>
                    {visibleRows.map((row) => {
                      const cell = row.cells[columnIndex];
                      return (
                        <td
                          className={`freqCell ${cell?.count ? 'hasCount' : ''} ${cell?.isSpecial ? 'isSpecial' : ''}`}
                          key={`${column.date}-${row.digit}`}
                          title={cell?.title}
                        >
                          {cell?.count || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
