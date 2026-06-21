export type DrawStatus = 'before' | 'live' | 'after' | 'off_day';
export type LotteryDrawRegion = 'north' | 'central' | 'south';

export type DrawWindow = {
  start: string;
  end: string;
  liveUntil: string;
  label: string;
};

export type DrawInfo = {
  code: string;
  region: LotteryDrawRegion;
  date: string;
  dayOfWeek: number;
  status: DrawStatus;
  window: DrawWindow;
  scheduledToday: boolean;
  shouldPollRealtime: boolean;
  shouldFetchFinal: boolean;
  shouldUseSimulationOnly: boolean;
  message: string;
  shortMessage: string;
};

const DRAW_WINDOWS: Record<LotteryDrawRegion, DrawWindow> = {
  south: {
    start: '16:15',
    end: '16:35',
    liveUntil: '16:50',
    label: '16h15 - 16h35'
  },
  central: {
    start: '17:15',
    end: '17:35',
    liveUntil: '17:50',
    label: '17h15 - 17h35'
  },
  north: {
    start: '18:15',
    end: '18:35',
    liveUntil: '18:50',
    label: '18h15 - 18h35'
  }
};

// JS weekday: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7.
// Lịch này dùng cho nút quay thử/realtime, để tránh lấy kết quả thật sai đài.
const DRAW_DAYS_BY_CODE: Record<string, number[]> = {
  // Miền/tổng hợp: có kết quả mỗi ngày, nhưng tỉnh/đài cụ thể vẫn được kiểm tra riêng.
  xsmb: [0, 1, 2, 3, 4, 5, 6],
  xsmn: [0, 1, 2, 3, 4, 5, 6],
  xsmt: [0, 1, 2, 3, 4, 5, 6],

  // Miền Bắc theo đài đại diện.
  hanoi: [1, 4],
  'bac-ninh': [3],
  'thai-binh': [0],
  'hai-phong': [5],
  'nam-dinh': [6],
  'quang-ninh': [2],

  // Miền Nam.
  xshcm: [1, 6],
  xstp: [1, 6],
  xsdt: [1],
  xscm: [1],
  xsbt: [2],
  xsvt: [2],
  xsbl: [2],
  xsdn: [3],
  xsct: [3],
  xsst: [3],
  xstn: [4],
  xsag: [4],
  xsbth: [4],
  xsvl: [5],
  xsbd: [5],
  xstv: [5],
  xsla: [6],
  xsbp: [6],
  xshg: [6],
  xstg: [0],
  xskg: [0],
  xsld: [0],
  xsdl: [0],

  // Miền Trung.
  xstth: [1],
  xspy: [1],
  xsdlk: [2],
  xsqnm: [2],
  xsqna: [2],
  xsdng: [3, 6],
  xskh: [3, 0],
  xsbdi: [4],
  xsqb: [4],
  xsqt: [4],
  xsgl: [5],
  xsnt: [5],
  xsqng: [6],
  xsdno: [6],
  xskt: [0]
};

function getVietnamParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number(parts.hour || 0);
  const minute = Number(parts.minute || 0);
  const dateForWeekday = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));

  return {
    date,
    hour,
    minute,
    minutes: hour * 60 + minute,
    dayOfWeek: dateForWeekday.getUTCDay()
  };
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

export function getDrawDaysForCode(code: string) {
  return DRAW_DAYS_BY_CODE[normalizeCode(code)] || null;
}

export function isScheduledToday(code: string, dayOfWeek: number) {
  const drawDays = getDrawDaysForCode(code);
  if (!drawDays) return true;
  return drawDays.includes(dayOfWeek);
}

export function getDrawWindow(region: LotteryDrawRegion) {
  return DRAW_WINDOWS[region];
}

export function getLotteryDrawInfo({
  code,
  region,
  now = new Date()
}: {
  code: string;
  region: LotteryDrawRegion;
  now?: Date;
}): DrawInfo {
  const vietnam = getVietnamParts(now);
  const window = getDrawWindow(region);
  const start = parseTimeToMinutes(window.start);
  const liveUntil = parseTimeToMinutes(window.liveUntil);
  const scheduledToday = isScheduledToday(code, vietnam.dayOfWeek);

  let status: DrawStatus;
  if (!scheduledToday) {
    status = 'off_day';
  } else if (vietnam.minutes < start) {
    status = 'before';
  } else if (vietnam.minutes <= liveUntil) {
    status = 'live';
  } else {
    status = 'after';
  }

  const shortMessageByStatus: Record<DrawStatus, string> = {
    before: `Chưa đến giờ mở thưởng ${window.label}`,
    live: `Đang trong khung mở thưởng ${window.label}`,
    after: `Đã qua giờ mở thưởng ${window.label}`,
    off_day: 'Hôm nay đài này không mở thưởng'
  };

  const messageByStatus: Record<DrawStatus, string> = {
    before: `Chưa đến giờ mở thưởng (${window.label}). Hệ thống chỉ quay thử mô phỏng, không gọi realtime liên tục.`,
    live: `Đang trong khung mở thưởng (${window.label}). Hệ thống sẽ tự gọi realtime; ô nào có kết quả thật sẽ dừng và hiển thị ngay.`,
    after: `Đã qua giờ mở thưởng (${window.label}). Hệ thống ưu tiên lấy kết quả thật; nếu nguồn chưa cập nhật thì tiếp tục quay mô phỏng trong lúc chờ dữ liệu.`,
    off_day: 'Hôm nay đài đã chọn không có lịch quay. Kết quả hiển thị chỉ là quay thử mô phỏng.'
  };

  return {
    code: normalizeCode(code),
    region,
    date: vietnam.date,
    dayOfWeek: vietnam.dayOfWeek,
    status,
    window,
    scheduledToday,
    shouldPollRealtime: status === 'live' || status === 'after',
    shouldFetchFinal: status === 'after',
    shouldUseSimulationOnly: status === 'before' || status === 'off_day',
    message: messageByStatus[status],
    shortMessage: shortMessageByStatus[status]
  };
}
