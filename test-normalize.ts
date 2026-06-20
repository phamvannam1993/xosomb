import { getVietlottProduct } from './src/lib/vietlott/catalog';
import { normalizeVietlottText } from './src/lib/vietlott/normalize';
const product = getVietlottProduct('power-655')!;
const text = `Xổ số Power ngày 18/06 (Thứ Năm) Kỳ mở thưởng: #01360 Kết quả 01 04 14 20 46 49 Số JP2 36 Thống kê trúng giải Giải Trùng khớp Số người trúng Trị giá giải (VNĐ) J.pot 0 52,693,539,150 Jpot2 0 4,922,441,800 G.1 8 40,000,000 G.2 592 500,000 G.3 14,045 50,000`;
console.log(JSON.stringify(normalizeVietlottText(text, product, {date:'2026-06-18', sourceName:'test'}), null, 2));
