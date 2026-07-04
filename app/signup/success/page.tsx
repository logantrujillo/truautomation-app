'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const router = useRouter();
  const [status, setStatus] = useState<'waiting' | 'active' | 'timeout'>('waiting');

  useEffect(() => {
    let attempts = 0;
    const supabase = createClient();

    const interval = setInterval(async () => {
      attempts += 1;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase.from('clients').select('status').eq('id', user.id).single();

      if (client?.status === 'active') {
        clearInterval(interval);
        setStatus('active');
        setTimeout(() => router.push('/dashboard'), 1500);
        return;
      }

      if (attempts >= 15) {
        clearInterval(interval);
        setStatus('timeout');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ padding: 40, maxWidth: 480, textAlign: 'center' }}>
        {status === 'waiting' && (
          <>
            <h1 style={{ fontSize: 26, marginBottom: 12 }}>Confirming Your Payment…</h1>
            <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6 }}>
              This usually takes a few seconds. We&apos;re setting up your account now.
            </p>
          </>
        )}
        {status === 'active' && (
          <>
            <h1 style={{ fontSize: 26, marginBottom: 12, color: 'var(--yellow)' }}>You&apos;re All Set!</h1>
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Redirecting to your dashboard…</p>
          </>
        )}
        {status === 'timeout' && (
          <>
            <h1 style={{ fontSize: 26, marginBottom: 12 }}>Almost There</h1>
            <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6 }}>
              Your payment went through — we&apos;re finishing account setup and will email you shortly.
              You can also check your <a href="/dashboard" style={{ color: 'var(--orange)' }}>dashboard</a> in a minute.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
