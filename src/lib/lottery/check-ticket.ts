import type { LotteryResult, PrizeRow } from './types';
import { getSpecByLabel } from './schemes';

export type TicketCheckStatus = 'valid' | 'invalid';

export type TicketPrizeMatch = {
  prizeLabel: string;
  prizeShortLabel: string;
  prizeNumber: string;
  matchedDigits: number;
  matchType: string;
};

export type TicketCheckResult = {
  input: string;
  ticket: string;
  status: TicketCheckStatus;
  message: string;
  matches: TicketPrizeMatch[];
};

const MAX_TICKETS_PER_REQUEST = 50;
const MIN_TICKET_LENGTH = 5;
const MAX_TICKET_LENGTH = 6;

export function normalizeTicketNumber(input: string) {
  return input.replace(/\D/g, '');
}

export function splitTicketInput(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .flatMap((item) => String(item ?? '').split(/[\n,;]+/))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(input ?? '')
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeTicketInputs(input: unknown) {
  return splitTicketInput(input).slice(0, MAX_TICKETS_PER_REQUEST);
}

export function getMaxTicketsPerRequest() {
  return MAX_TICKETS_PER_REQUEST;
}

export function isValidTicketNumber(ticket: string) {
  return ticket.length >= MIN_TICKET_LENGTH && ticket.length <= MAX_TICKET_LENGTH;
}

function matchTypeLabel(matchedDigits: number) {
  if (matchedDigits >= 6) return 'Khớp 6 số';
  if (matchedDigits === 5) return 'Khớp 5 số';
  return `Khớp ${matchedDigits} số cuối`;
}

function uniquePrizeNumbers(rows: PrizeRow[]) {
  const seen = new Set<string>();
  return rows.flatMap((row) =>
    row.numbers
      .map((number) => ({ row, prizeNumber: normalizeTicketNumber(number) }))
      .filter(({ prizeNumber }) => {
        const key = `${row.label}:${prizeNumber}`;
        if (!prizeNumber || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
  );
}

export function checkTicketAgainstResult(input: string, result: LotteryResult): TicketCheckResult {
  const ticket = normalizeTicketNumber(input);

  if (!ticket) {
    return {
      input,
      ticket,
      status: 'invalid',
      message: 'Vui lòng nhập số trên vé.',
      matches: []
    };
  }

  if (!isValidTicketNumber(ticket)) {
    return {
      input,
      ticket,
      status: 'invalid',
      message: 'Vui lòng nhập số vé gồm 5 hoặc 6 chữ số.',
      matches: []
    };
  }

  const matches = uniquePrizeNumbers(result.prizes)
    .filter(({ prizeNumber }) => ticket.length >= prizeNumber.length && ticket.endsWith(prizeNumber))
    .map(({ row, prizeNumber }) => {
      const spec = getSpecByLabel(result.scheme, row.label);
      const prizeShortLabel = spec?.shortLabel || row.label;

      return {
        prizeLabel: row.label,
        prizeShortLabel,
        prizeNumber,
        matchedDigits: prizeNumber.length,
        matchType: matchTypeLabel(prizeNumber.length)
      } satisfies TicketPrizeMatch;
    })
    .sort((a, b) => b.matchedDigits - a.matchedDigits || a.prizeShortLabel.localeCompare(b.prizeShortLabel));

  return {
    input,
    ticket,
    status: 'valid',
    message: matches.length
      ? `Số ${ticket} có ${matches.length} kết quả khớp.`
      : `Số ${ticket} chưa khớp giải nào trong kỳ ${result.shortName} ngày ${result.date}.`,
    matches
  };
}

export function checkTicketsAgainstResult(inputs: string[], result: LotteryResult) {
  return inputs.map((input) => checkTicketAgainstResult(input, result));
}
