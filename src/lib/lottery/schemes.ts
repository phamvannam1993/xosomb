import type { PrizeSchemeId, PrizeSpec } from './types';

export const PRIZE_SCHEMES: Record<PrizeSchemeId, PrizeSpec[]> = {
  north: [
    { label: 'Đặc biệt', shortLabel: 'ĐB', count: 1, length: 5, isSpecial: true },
    { label: 'Giải nhất', shortLabel: 'G1', count: 1, length: 5 },
    { label: 'Giải nhì', shortLabel: 'G2', count: 2, length: 5 },
    { label: 'Giải ba', shortLabel: 'G3', count: 6, length: 5 },
    { label: 'Giải tư', shortLabel: 'G4', count: 4, length: 4 },
    { label: 'Giải năm', shortLabel: 'G5', count: 6, length: 4 },
    { label: 'Giải sáu', shortLabel: 'G6', count: 3, length: 3 },
    { label: 'Giải bảy', shortLabel: 'G7', count: 4, length: 2 }
  ],
  southCentral: [
    { label: 'Giải tám', shortLabel: 'G8', count: 1, length: 2 },
    { label: 'Giải bảy', shortLabel: 'G7', count: 1, length: 3 },
    { label: 'Giải sáu', shortLabel: 'G6', count: 3, length: 4 },
    { label: 'Giải năm', shortLabel: 'G5', count: 1, length: 4 },
    { label: 'Giải tư', shortLabel: 'G4', count: 7, length: 5 },
    { label: 'Giải ba', shortLabel: 'G3', count: 2, length: 5 },
    { label: 'Giải nhì', shortLabel: 'G2', count: 1, length: 5 },
    { label: 'Giải nhất', shortLabel: 'G1', count: 1, length: 5 },
    { label: 'Đặc biệt', shortLabel: 'ĐB', count: 1, length: 6, isSpecial: true }
  ]
};

export function getPrizeSpecs(scheme: PrizeSchemeId) {
  return PRIZE_SCHEMES[scheme];
}

export function getSpecByLabel(scheme: PrizeSchemeId, label: string) {
  return getPrizeSpecs(scheme).find((spec) => spec.label === label || spec.shortLabel === label);
}

export function getSpecialSpec(scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).find((spec) => spec.isSpecial) || getPrizeSpecs(scheme)[0];
}

export function getShortPrizeLabel(scheme: PrizeSchemeId, label: string) {
  return getSpecByLabel(scheme, label)?.shortLabel || label;
}
