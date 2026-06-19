'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LotteryResult } from '@/lib/lottery/types';
import { buildHeadTailTable, toVietnameseDate } from '@/lib/lottery/format';
import { getShortPrizeLabel } from '@/lib/lottery/schemes';

type ResultBoardProps = {
  result: LotteryResult;
  headingLevel?: 1 | 2;
};

type DisplayMode = 'all' | 'last2' | 'last3';

const digits = Array.from({ length: 10 }, (_, index) => String(index));

function displayNumber(value: string, mode: DisplayMode) {
  if (mode === 'last2') return value.slice(-2);
  if (mode === 'last3') return value.slice(-3);
  return value;
}

function titleFor(result: LotteryResult) {
  if (result.code === 'xsmb') return 'XSMB - Kết quả xổ số miền Bắc';
  return `${result.shortName} - Kết quả ${result.province}`;
}

export function ResultBoard({ result, headingLevel = 1 }: ResultBoardProps) {
  const [mode, setMode] = useState<DisplayMode>('all');
  const [activeDigit, setActiveDigit] = useState<string | null>(null);
  const headTailRows = buildHeadTailTable(result);
  const dateText = toVietnameseDate(result.date);
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <article className="resultBoard" id={`${result.code}-${result.date}`}>
      <table className="lotteryTable">
        <tbody>
          <tr>
            <th colSpan={2} className="resultHeading">
              <HeadingTag>
                <Link href={`/${result.code}`}>{titleFor(result)}</Link>
              </HeadingTag>
              <p>
                <Link href={`/${result.code}`}>{result.shortName}</Link> /{' '}
                <Link href={`/${result.code}/${result.date}`}>{result.shortName} {result.date}</Link> / {dateText}
              </p>
            </th>
          </tr>
          <tr>
            <td colSpan={2} className="codeRow">
              Tường thuật kết quả đầy đủ · Cập nhật: {new Date(result.updatedAt).toLocaleString('vi-VN')}
            </td>
          </tr>
          {result.prizes.map((row, index) => {
            const isSpecial = row.label === 'Đặc biệt';
            return (
              <tr className={index % 2 === 0 ? '' : 'striped'} key={row.label}>
                <td className={isSpecial ? 'prizeLabel specialLabel' : 'prizeLabel'}>
                  {getShortPrizeLabel(result.scheme, row.label)}
                </td>
                <td className="prizeCell">
                  <div className={`numberGrid count-${row.numbers.length}`}>
                    {row.numbers.map((number) => {
                      const lastTwo = number.slice(-2);
                      const isHighlighted = activeDigit ? lastTwo.includes(activeDigit) : false;
                      return (
                        <span
                          className={isSpecial ? 'drawNumber specialNumber' : 'drawNumber'}
                          data-original={number}
                          data-last-two={lastTwo}
                          data-highlighted={isHighlighted ? 'true' : 'false'}
                          key={`${row.label}-${number}`}
                          title={number}
                        >
                          {displayNumber(number, mode)}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="filterContainer">
        <fieldset className="radioGroup">
          <legend>Kiểu hiển thị</legend>
          <label>
            <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} /> Đầy đủ
          </label>
          <label>
            <input type="radio" checked={mode === 'last2'} onChange={() => setMode('last2')} /> 2 số
          </label>
          <label>
            <input type="radio" checked={mode === 'last3'} onChange={() => setMode('last3')} /> 3 số
          </label>
        </fieldset>
        <div className="digitFilter" aria-label="Lọc nhanh chữ số cuối">
          {digits.map((digit) => (
            <button
              type="button"
              className={activeDigit === digit ? 'digitButton active' : 'digitButton'}
              onMouseEnter={() => setActiveDigit(digit)}
              onMouseLeave={() => setActiveDigit(null)}
              onFocus={() => setActiveDigit(digit)}
              onBlur={() => setActiveDigit(null)}
              onClick={() => setActiveDigit(activeDigit === digit ? null : digit)}
              key={digit}
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      <table className="lotoTable">
        <tbody>
          <tr>
            <th colSpan={4} className="lotoTitle">
              <Link href={`/${result.code}`}>Bảng lô tô 2 số cuối {result.shortName}</Link> /{' '}
              <Link href={`/${result.code}`}>Sổ kết quả gần đây</Link>
            </th>
          </tr>
          <tr>
            <th>Đầu</th>
            <th>Lô tô</th>
            <th>Đuôi</th>
            <th>Lô tô</th>
          </tr>
          {headTailRows.map((row, index) => (
            <tr className={index % 2 === 0 ? 'striped' : ''} key={row.digit}>
              <td className="digitCell">{row.digit}</td>
              <td>{row.headValues.length ? row.headValues.join(', ') : '—'}</td>
              <td className="digitCell">{row.digit}</td>
              <td>{row.tailValues.length ? row.tailValues.join(', ') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
