"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSourcesByRegion } from "@/lib/lottery/catalog";
import {
  buildHeadTailTable,
  todayInVietnam,
  toVietnameseDate,
} from "@/lib/lottery/format";
import { getPrizeSpecs, getShortPrizeLabel } from "@/lib/lottery/schemes";
import type { LotteryResult, PrizeSchemeId } from "@/lib/lottery/types";

type QuayRegion = "xsmb" | "xsmn" | "xsmt";
type DisplayMode = "all" | "last2" | "last3";

type Option = {
  code: string;
  label: string;
  shortName: string;
};

type ActiveCell = {
  rowIndex: number;
  numberIndex: number;
} | null;

type DrawStep = {
  rowIndex: number;
  numberIndex: number;
  label: string;
  number: string;
  length: number;
  rowCount: number;
};

type RegionConfig = {
  key: QuayRegion;
  href: string;
  label: string;
  title: string;
  scheme: PrizeSchemeId;
  code: string;
  province: string;
  shortName: string;
  options: Option[];
};

const digits = Array.from({ length: 10 }, (_, index) => String(index));

const northStations: Option[] = [
  { code: "hanoi", label: "Hà Nội", shortName: "XSHN" },
  { code: "bac-ninh", label: "Bắc Ninh", shortName: "XSBN" },
  { code: "thai-binh", label: "Thái Bình", shortName: "XSTB" },
  { code: "hai-phong", label: "Hải Phòng", shortName: "XSHP" },
  { code: "nam-dinh", label: "Nam Định", shortName: "XSNĐ" },
  { code: "quang-ninh", label: "Quảng Ninh", shortName: "XSQN" },
];

function cleanProvinceName(name: string) {
  return name.replace(/^Xổ số\s+/i, "").trim();
}

function getRegionConfig(region: QuayRegion): RegionConfig {
  if (region === "xsmn") {
    const options = getSourcesByRegion("south")
      .filter((source) => source.code !== "xsmn")
      .map((source) => ({
        code: source.code,
        label: cleanProvinceName(source.name),
        shortName: source.shortName,
      }));

    return {
      key: "xsmn",
      href: "/quay-thu-xsmn",
      label: "Quay thử XSMN",
      title: "Quay thử xổ số miền Nam",
      scheme: "southCentral",
      code: "xsmn",
      province: "Miền Nam",
      shortName: "XSMN",
      options,
    };
  }

  if (region === "xsmt") {
    const options = getSourcesByRegion("central")
      .filter((source) => source.code !== "xsmt")
      .map((source) => ({
        code: source.code,
        label: cleanProvinceName(source.name),
        shortName: source.shortName,
      }));

    return {
      key: "xsmt",
      href: "/quay-thu-xsmt",
      label: "Quay thử XSMT",
      title: "Quay thử xổ số miền Trung",
      scheme: "southCentral",
      code: "xsmt",
      province: "Miền Trung",
      shortName: "XSMT",
      options,
    };
  }

  return {
    key: "xsmb",
    href: "/quay-thu-xsmb",
    label: "Quay thử XSMB",
    title: "Quay thử xổ số miền Bắc",
    scheme: "north",
    code: "xsmb",
    province: "Miền Bắc",
    shortName: "XSMB",
    options: northStations,
  };
}

function randomInt(max: number) {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function randomNumber(length: number) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += randomInt(10).toString();
  }
  return value;
}

function createMockResult(
  config: RegionConfig,
  selectedOption: Option,
): LotteryResult {
  const prizes = getPrizeSpecs(config.scheme).map((spec) => ({
    label: spec.label,
    numbers: Array.from({ length: spec.count }, () =>
      randomNumber(spec.length),
    ),
  }));
  const specialPrize =
    prizes.find((row) => row.label === "Đặc biệt")?.numbers[0] || "";
  const date = todayInVietnam();
  const province =
    config.key === "xsmb"
      ? `Miền Bắc - ${selectedOption.label}`
      : selectedOption.label;

  return {
    date,
    code: config.code,
    region:
      config.key === "xsmb"
        ? "north"
        : config.key === "xsmn"
          ? "south"
          : "central",
    province,
    shortName: config.key === "xsmb" ? "XSMB" : selectedOption.shortName,
    scheme: config.scheme,
    specialPrize,
    prizes,
    sourceName: "Mô phỏng quay thử",
    updatedAt: new Date().toISOString(),
    dataSource: "mock",
    isMock: true,
  };
}

function displayNumber(value: string, mode: DisplayMode) {
  if (mode === "last2") return value.slice(-2);
  if (mode === "last3") return value.slice(-3);
  return value;
}

function SpinnerCell() {
  return <span className="spinDots" aria-label="Đang quay" />;
}

function buildBlankRows(scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).map((spec) => ({
    label: spec.label,
    numbers: Array.from({ length: spec.count }, () => ""),
  }));
}

function clonePrizeRows(rows: LotteryResult["prizes"]) {
  return rows.map((row) => ({ label: row.label, numbers: [...row.numbers] }));
}

function setCellValue(
  rows: LotteryResult["prizes"],
  rowIndex: number,
  numberIndex: number,
  value: string,
) {
  const nextRows = clonePrizeRows(rows);
  nextRows[rowIndex].numbers[numberIndex] = value;
  return nextRows;
}

function isSpecialPrizeLabel(label: string) {
  return label === "Đặc biệt" || /^đb$/iu.test(label) || /đặc\s*biệt/iu.test(label);
}

function buildDrawSteps(result: LotteryResult): DrawStep[] {
  const steps = result.prizes.flatMap((row, rowIndex) =>
    row.numbers.map((number, numberIndex) => ({
      rowIndex,
      numberIndex,
      label: row.label,
      number,
      length: number.length,
      rowCount: row.numbers.length,
    })),
  );

  const normalSteps = steps.filter((step) => !isSpecialPrizeLabel(step.label));
  const specialSteps = steps.filter((step) => isSpecialPrizeLabel(step.label));

  return [...normalSteps, ...specialSteps];
}

function getStepDuration(step: DrawStep) {
  if (isSpecialPrizeLabel(step.label)) return 2200;
  if (step.length >= 5) return 900;
  if (step.length === 4) return 760;
  if (step.length === 3) return 660;
  return 560;
}

function getStepGap(step: DrawStep) {
  if (isSpecialPrizeLabel(step.label)) return 320;
  if (step.length >= 5) return 180;
  return 150;
}

function getSpinTickMs(step: DrawStep) {
  if (isSpecialPrizeLabel(step.label)) return 115;
  if (step.length >= 5) return 96;
  return 88;
}

export function QuayThuSimulator({
  initialRegion,
}: {
  initialRegion: QuayRegion;
}) {
  const config = useMemo(() => getRegionConfig(initialRegion), [initialRegion]);
  const blankRows = useMemo(
    () => buildBlankRows(config.scheme),
    [config.scheme],
  );
  const [selectedCode, setSelectedCode] = useState(
    config.options[0]?.code || config.code,
  );
  const selectedOption = config.options.find(
    (item) => item.code === selectedCode,
  ) ||
    config.options[0] || {
      code: config.code,
      label: config.province,
      shortName: config.shortName,
    };
  const [mode, setMode] = useState<DisplayMode>("all");
  const [activeDigit, setActiveDigit] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [spinStatus, setSpinStatus] = useState("Sẵn sàng quay thử");
  const [displayRows, setDisplayRows] = useState(blankRows);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const timeoutRefs = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const sessionRef = useRef(0);

  const headTailRows = result ? buildHeadTailTable(result) : [];
  const dateText = toVietnameseDate(todayInVietnam());

  function clearSpinTimers() {
    timeoutRefs.current.forEach((timerId) => window.clearTimeout(timerId));
    timeoutRefs.current = [];

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetBoard(status = "Sẵn sàng quay thử") {
    clearSpinTimers();
    sessionRef.current += 1;
    setResult(null);
    setIsSpinning(false);
    setActiveCell(null);
    setSpinStatus(status);
    setDisplayRows(buildBlankRows(config.scheme));
  }

  useEffect(() => {
    return () => {
      clearSpinTimers();
      sessionRef.current += 1;
    };
  }, []);

  function handleSpin() {
    clearSpinTimers();

    const targetResult = createMockResult(config, selectedOption);
    const steps = buildDrawSteps(targetResult);
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;

    setResult(null);
    setDisplayRows(buildBlankRows(config.scheme));
    setIsSpinning(true);
    setActiveCell(null);
    setSpinStatus("Đang chuẩn bị quay...");

    let delay = 180;

    steps.forEach((step, stepIndex) => {
      const duration = getStepDuration(step);
      const startTimer = window.setTimeout(() => {
        if (sessionRef.current !== sessionId) return;

        setActiveCell({
          rowIndex: step.rowIndex,
          numberIndex: step.numberIndex,
        });
        setSpinStatus(
          isSpecialPrizeLabel(step.label)
            ? "Đang quay giải đặc biệt cuối cùng"
            : `Đang quay ${getShortPrizeLabel(config.scheme, step.label)}${step.rowCount > 1 ? ` - ô ${step.numberIndex + 1}` : ""}`,
        );
        setDisplayRows((currentRows) =>
          setCellValue(
            currentRows,
            step.rowIndex,
            step.numberIndex,
            randomNumber(step.length),
          ),
        );

        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }

        intervalRef.current = window.setInterval(() => {
          if (sessionRef.current !== sessionId) return;
          setDisplayRows((currentRows) =>
            setCellValue(
              currentRows,
              step.rowIndex,
              step.numberIndex,
              randomNumber(step.length),
            ),
          );
        }, getSpinTickMs(step));

        const stopTimer = window.setTimeout(() => {
          if (sessionRef.current !== sessionId) return;

          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setDisplayRows((currentRows) =>
            setCellValue(
              currentRows,
              step.rowIndex,
              step.numberIndex,
              step.number,
            ),
          );
          setActiveCell(null);

          if (stepIndex === steps.length - 1) {
            setResult(targetResult);
            setIsSpinning(false);
            setSpinStatus("Đã quay xong");
          }
        }, duration);

        timeoutRefs.current.push(stopTimer);
      }, delay);

      timeoutRefs.current.push(startTimer);
      delay += duration + getStepGap(step);
    });
  }

  function handleProvinceChange(value: string) {
    setSelectedCode(value);
    resetBoard("Sẵn sàng quay thử");
  }

  return (
    <section className="quayThuPanel" aria-label={config.title}>
      <div
        className="quayTabs"
        role="navigation"
        aria-label="Chọn miền quay thử"
      >
        <Link href="/quay-thu-xsmb" data-active={initialRegion === "xsmb"}>
          Quay thử XSMB
        </Link>
        <Link href="/quay-thu-xsmt" data-active={initialRegion === "xsmt"}>
          Quay thử XSMT
        </Link>
        <Link href="/quay-thu-xsmn" data-active={initialRegion === "xsmn"}>
          Quay thử XSMN
        </Link>
      </div>

      <div className="quayIntro">
        <h1>
          {config.title} ngày {dateText.replace(/^.*?,\s*/u, "")}
        </h1>
        <p>
          Công cụ mô phỏng kết quả để tham khảo giao diện. Kết quả quay thử
          không phải kết quả mở thưởng thật và không có giá trị dự đoán.
        </p>
      </div>

      <div className="quayControlBar">
        <label htmlFor="quay-province">Chọn đài</label>
        <select
          id="quay-province"
          value={selectedCode}
          onChange={(event) => handleProvinceChange(event.target.value)}
        >
          {config.options.map((option) => (
            <option value={option.code} key={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleSpin} disabled={isSpinning}>
          {isSpinning ? "Đang quay..." : "Bắt đầu quay"}
        </button>
        <span className="quayStatus" aria-live="polite">
          {spinStatus}
        </span>
      </div>

      <article className="quayBoard">
        <table className="lotteryTable quayLotteryTable">
          <tbody>
            <tr>
              <th colSpan={2} className="resultHeading quayHeading">
                <h2>
                  {config.label}{" "}
                  {config.key === "xsmb" ? "miền Bắc" : selectedOption.label}
                </h2>
                <p>
                  {config.shortName} / {selectedOption.label} / {dateText}
                </p>
              </th>
            </tr>
            {displayRows.map((row, index) => {
              const isSpecial = row.label === "Đặc biệt";
              return (
                <tr
                  className={index % 2 === 0 ? "" : "striped"}
                  key={row.label}
                >
                  <td
                    className={
                      isSpecial ? "prizeLabel specialLabel" : "prizeLabel"
                    }
                  >
                    {getShortPrizeLabel(config.scheme, row.label)}
                  </td>
                  <td className="prizeCell">
                    <div className={`numberGrid count-${row.numbers.length}`}>
                      {row.numbers.map((number, numberIndex) => {
                        const lastTwo = number.slice(-2);
                        const isHighlighted =
                          activeDigit && number
                            ? lastTwo.includes(activeDigit)
                            : false;
                        const isActiveCell =
                          activeCell?.rowIndex === index &&
                          activeCell.numberIndex === numberIndex;
                        const isWaitingCell =
                          isSpinning && !number && !isActiveCell;

                        return (
                          <span
                            className={
                              isSpecial
                                ? "drawNumber specialNumber"
                                : "drawNumber"
                            }
                            data-highlighted={isHighlighted ? "true" : "false"}
                            data-spinning={isActiveCell ? "true" : "false"}
                            data-waiting={isWaitingCell ? "true" : "false"}
                            key={`${row.label}-${numberIndex}`}
                            title={number || row.label}
                          >
                            {isWaitingCell ? (
                              <SpinnerCell />
                            ) : number ? (
                              displayNumber(number, mode)
                            ) : (
                              <span className="emptyNumber">—</span>
                            )}
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

        <div className="filterContainer quayFilter">
          <fieldset className="radioGroup">
            <legend>Kiểu hiển thị</legend>
            <label>
              <input
                type="radio"
                checked={mode === "all"}
                onChange={() => setMode("all")}
              />{" "}
              Tất cả
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "last2"}
                onChange={() => setMode("last2")}
              />{" "}
              2 số cuối
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "last3"}
                onChange={() => setMode("last3")}
              />{" "}
              3 số cuối
            </label>
          </fieldset>
          <div className="digitFilter" aria-label="Lọc nhanh chữ số cuối">
            {digits.map((digit) => (
              <button
                type="button"
                className={
                  activeDigit === digit ? "digitButton active" : "digitButton"
                }
                onMouseEnter={() => setActiveDigit(digit)}
                onMouseLeave={() => setActiveDigit(null)}
                onFocus={() => setActiveDigit(digit)}
                onBlur={() => setActiveDigit(null)}
                onClick={() =>
                  setActiveDigit(activeDigit === digit ? null : digit)
                }
                key={digit}
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      </article>

      {result ? (
        <table className="lotoTable quayLotoTable">
          <tbody>
            <tr>
              <th colSpan={4} className="lotoTitle">
                Bảng lô tô 2 số cuối từ kết quả quay thử
              </th>
            </tr>
            <tr>
              <th>Đầu</th>
              <th>Lô tô</th>
              <th>Đuôi</th>
              <th>Lô tô</th>
            </tr>
            {headTailRows.map((row, index) => (
              <tr className={index % 2 === 0 ? "striped" : ""} key={row.digit}>
                <td className="digitCell">{row.digit}</td>
                <td>
                  {row.headValues.length ? row.headValues.join(", ") : "—"}
                </td>
                <td className="digitCell">{row.digit}</td>
                <td>
                  {row.tailValues.length ? row.tailValues.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
