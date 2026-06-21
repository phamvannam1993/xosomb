'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { todayInVietnam } from '@/lib/lottery/format';

type DateSearchFormProps = {
  defaultDate?: string;
  code?: string;
};

export function DateSearchForm({ defaultDate, code = 'xsmb' }: DateSearchFormProps) {
  const router = useRouter();
  const today = todayInVietnam();
  const [date, setDate] = useState(defaultDate && defaultDate <= today ? defaultDate : today);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || date > today) return;
    router.push(`/${code}/${date}`);
  }

  return (
    <form className="dateForm" onSubmit={onSubmit}>
      <label htmlFor="date">Chọn ngày</label>
      <input id="date" type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} />
      <button type="submit">Xem kết quả</button>
    </form>
  );
}
