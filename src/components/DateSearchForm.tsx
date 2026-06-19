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
  const [date, setDate] = useState(defaultDate || todayInVietnam());

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/${code}/${date}`);
  }

  return (
    <form className="dateForm" onSubmit={onSubmit}>
      <label htmlFor="date">Chọn ngày</label>
      <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <button type="submit">Xem kết quả</button>
    </form>
  );
}
