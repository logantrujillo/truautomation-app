'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncTwilioButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    await fetch('/api/admin/twilio-numbers');
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" className="btn-secondary" onClick={handleSync} disabled={loading}>
      {loading ? 'Syncing…' : 'Sync Numbers from Twilio'}
    </button>
  );
}
