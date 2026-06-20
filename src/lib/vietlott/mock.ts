import { getVietlottProduct } from './catalog';
import type { VietlottProductId, VietlottResult } from './types';

const baseUpdatedAt = '2026-06-19T18:30:00+07:00';

export const mockVietlottResults: Record<VietlottProductId, VietlottResult> = {
  'mega-645': {
    product: 'mega-645',
    productName: 'Xổ số Mega 6/45',
    shortName: 'Mega 6/45',
    date: '2026-06-17',
    drawId: '01524',
    numbers: ['05', '06', '16', '28', '35', '39'],
    rows: [
      { label: 'Jackpot', winners: '0', prizeValue: '16,455,362,500' },
      { label: 'Giải nhất', winners: '25', prizeValue: '10,000,000' },
      { label: 'Giải nhì', winners: '1,171', prizeValue: '300,000' },
      { label: 'Giải ba', winners: '18,429', prizeValue: '30,000' }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: baseUpdatedAt,
    isMock: true,
    dataSource: 'mock'
  },
  'power-655': {
    product: 'power-655',
    productName: 'Xổ số Power 6/55',
    shortName: 'Power 6/55',
    date: '2026-06-18',
    drawId: '01360',
    numbers: ['01', '04', '14', '20', '46', '49'],
    bonusNumber: '36',
    rows: [
      { label: 'Jackpot 1', winners: '0', prizeValue: '52,693,539,150' },
      { label: 'Jackpot 2', winners: '0', prizeValue: '4,922,441,800' },
      { label: 'Giải nhất', winners: '8', prizeValue: '40,000,000' },
      { label: 'Giải nhì', winners: '592', prizeValue: '500,000' },
      { label: 'Giải ba', winners: '14,045', prizeValue: '50,000' }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: baseUpdatedAt,
    isMock: true,
    dataSource: 'mock'
  },
  'max-3d': {
    product: 'max-3d',
    productName: 'Xổ số Max 3D',
    shortName: 'Max 3D',
    date: '2026-06-17',
    drawId: '01094',
    numbers: ['115', '771'],
    rows: [
      { label: 'Đặc biệt', numbers: ['115', '771'], winners: '31', prizeValue: '1.000.000 đ' },
      { label: 'Giải nhất', numbers: ['300', '879', '806', '415'], winners: '106', prizeValue: '350.000 đ' },
      { label: 'Giải nhì', numbers: ['113', '161', '143', '206', '878', '415'], winners: '136', prizeValue: '210.000 đ' },
      { label: 'Giải ba', numbers: ['066', '487', '702', '660', '212', '295', '950', '722'], winners: '105', prizeValue: '100.000 đ' }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: baseUpdatedAt,
    isMock: true,
    dataSource: 'mock'
  },
  'max-3d-pro': {
    product: 'max-3d-pro',
    productName: 'Xổ số Max 3D Pro',
    shortName: 'Max 3D Pro',
    date: '2026-06-18',
    drawId: '00741',
    numbers: ['483', '025'],
    rows: [
      { label: 'Đặc biệt', numbers: ['483', '025'], winners: '0', prizeValue: '2 tỷ' },
      { label: 'Phụ ĐB', numbers: ['025', '483'], winners: '0', prizeValue: '400tr' },
      { label: 'Giải nhất', numbers: ['305', '954', '862', '717'], winners: '1', prizeValue: '30tr' },
      { label: 'Giải nhì', numbers: ['524', '770', '291', '177', '670', '258'], winners: '7', prizeValue: '10tr' },
      { label: 'Giải ba', numbers: ['236', '337', '660', '882', '234', '990', '932', '512'], winners: '7', prizeValue: '4tr' },
      { label: 'Giải tư', matchText: 'Trùng bất kỳ 2 bộ ba số quay thưởng của giải Đặc biệt, Nhất, Nhì hoặc Ba', winners: '36', prizeValue: '1tr' },
      { label: 'Giải năm', matchText: 'Trùng 1 bộ ba số quay thưởng giải Đặc biệt bất kỳ', winners: '493', prizeValue: '100k' },
      { label: 'Giải sáu', matchText: 'Trùng 1 bộ ba số quay thưởng giải Nhất, Nhì hoặc Ba bất kỳ', winners: '5596', prizeValue: '40k' }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: baseUpdatedAt,
    isMock: true,
    dataSource: 'mock'
  }
};

export function mockVietlottLatest(productId: VietlottProductId) {
  return mockVietlottResults[productId] || mockVietlottResults['mega-645'];
}

export function mockVietlottByDate(productId: VietlottProductId, date: string) {
  const product = getVietlottProduct(productId)!;
  const base = mockVietlottLatest(product.id);
  return { ...base, date, product: product.id, productName: product.name, shortName: product.shortName };
}

export function mockRecentVietlott(productId: VietlottProductId, limit = 30) {
  const base = mockVietlottLatest(productId);
  const start = new Date(`${base.date}T00:00:00Z`);
  return Array.from({ length: limit }, (_, index) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - index * 2);
    return {
      ...base,
      date: d.toISOString().slice(0, 10),
      drawId: base.drawId ? String(Number(base.drawId) - index).padStart(base.drawId.length, '0') : undefined
    };
  });
}
