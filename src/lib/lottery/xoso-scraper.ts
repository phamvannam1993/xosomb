import type { LotteryResult } from './types';

export async function fetchLiveFromXosoWebsite(date: string): Promise<LotteryResult | null> {
  try {
    // Fetch homepage which contains today's lottery results
    const url = 'https://xoso.com.vn/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      cache: 'no-store'
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Parse HTML to extract prize data using IDs from xoso.com.vn structure
    const specialMatch = html.match(/id=mb_prizeDB_item0[^>]*>([^<]+)</);
    const prize1Match = html.match(/id=mb_prize1_item0[^>]*>([^<]+)</);
    const prize2Matches = html.match(/id=mb_prize2_item\d+[^>]*>([^<]+)</g) || [];
    const prize3Matches = html.match(/id=mb_prize3_item\d+[^>]*>([^<]+)</g) || [];
    const prize4Matches = html.match(/id=mb_prize4_item\d+[^>]*>([^<]+)</g) || [];
    const prize5Matches = html.match(/id=mb_prize5_item\d+[^>]*>([^<]+)</g) || [];
    const prize6Matches = html.match(/id=mb_prize6_item\d+[^>]*>([^<]+)</g) || [];
    const prize7Matches = html.match(/id=mb_prize7_item\d+[^>]*>([^<]+)</g) || [];

    const extractNumbers = (matches: string[]): string[] => {
      return matches.map(m => {
        const numMatch = m.match(/>([^<]+)</);
        return numMatch ? numMatch[1].trim() : '';
      }).filter(Boolean);
    };

    const specialPrize = specialMatch ? specialMatch[1].trim() : '';

    // If no data found, return null
    if (!specialPrize) return null;

    return {
      date,
      code: 'xsmb',
      region: 'north',
      province: 'Miền Bắc',
      shortName: 'XSMB',
      scheme: 'north',
      specialPrize,
      prizes: [
        { label: 'Đặc biệt', numbers: specialPrize ? [specialPrize] : [] },
        { label: 'Giải nhất', numbers: prize1Match ? [prize1Match[1].trim()] : [] },
        { label: 'Giải nhì', numbers: extractNumbers(prize2Matches) },
        { label: 'Giải ba', numbers: extractNumbers(prize3Matches) },
        { label: 'Giải tư', numbers: extractNumbers(prize4Matches) },
        { label: 'Giải năm', numbers: extractNumbers(prize5Matches) },
        { label: 'Giải sáu', numbers: extractNumbers(prize6Matches) },
        { label: 'Giải bảy', numbers: extractNumbers(prize7Matches) }
      ],
      sourceName: 'XoSo.com.vn Live',
      sourceUrl: url,
      updatedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      dataSource: 'html'
    };
  } catch (error) {
    console.error('Error fetching from xoso.com.vn:', error);
    return null;
  }
}
