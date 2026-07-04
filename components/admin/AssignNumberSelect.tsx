'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  clientId: string;
  currentNumber: string | null;
  availableNumbers: string[];
}

export default function AssignNumberSelect({ clientId, currentNumber, availableNumbers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const options = currentNumber ? [currentNumber, ...availableNumbers] : availableNumbers;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const phoneNumber = e.target.value;
    if (!phoneNumber) return;
    setLoading(true);
    await fetch('/api/admin/assign-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, phoneNumber }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select value={currentNumber ?? ''} onChange={handleChange} disabled={loading} style={{ minWidth: 160 }}>
      <option value="" disabled>
        {options.length === 0 ? 'No numbers available' : 'Assign number…'}
      </option>
      {options.map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}
