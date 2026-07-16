'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProgressBar from '@/components/signup/ProgressBar';
import Step1Account from '@/components/signup/Step1Account';
import Step2BusinessInfo from '@/components/signup/Step2BusinessInfo';
import Step3PlanSelection from '@/components/signup/Step3PlanSelection';
import Step4ServiceConfig from '@/components/signup/Step4ServiceConfig';
import Step5AlexSetup from '@/components/signup/Step5AlexSetup';
import Step6GoogleIntegration from '@/components/signup/Step6GoogleIntegration';
import Step7Review from '@/components/signup/Step7Review';
import { DEFAULT_WIZARD_STATE, type WizardState } from '@/components/signup/types';
import { getReceptionistBrand } from '@/lib/brand';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--gray)' }}>Loading…</p>
        </main>
      }
    >
      <SignupWizard />
    </Suspense>
  );
}

function SignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  function update(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  // Resume an in-progress signup if the user already has a session
  // (e.g. they refreshed mid-wizard, or came back from Google OAuth).
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);
        return;
      }

      const { data: client } = await supabase.from('clients').select('*').eq('id', user.id).single();

      if (!client) {
        setChecking(false);
        return;
      }

      if (client.status === 'active') {
        router.push('/dashboard');
        return;
      }

      setUserId(user.id);
      update({
        email: client.email ?? '',
        contactName: client.contact_name ?? '',
        businessName: client.business_name ?? '',
        phone: client.phone ?? '',
        industry: client.industry ?? '',
        address: client.address ?? '',
        plan: client.plan ?? '',
        alexInstructions: client.alex_instructions ?? '',
        businessHours: client.business_hours ?? DEFAULT_WIZARD_STATE.businessHours,
      });

      const { data: services } = await supabase.from('services').select('name, description').eq('client_id', user.id);
      if (services && services.length > 0) update({ services });

      const { data: faqs } = await supabase.from('faqs').select('question, answer').eq('client_id', user.id);
      if (faqs && faqs.length > 0) update({ faqs });

      const backFromGoogle = searchParams.get('google') === 'connected';
      if (backFromGoogle) update({ googleConnected: true });

      const resumeStep = searchParams.get('step');
      setStep(resumeStep ? Math.min(7, Math.max(2, parseInt(resumeStep, 10))) : 2);
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray)' }}>Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 40 }}>
            Get Started with <span style={{ color: 'var(--yellow)' }}>{getReceptionistBrand(state.industry)}</span>
          </h1>
        </div>

        <ProgressBar step={step} brand={getReceptionistBrand(state.industry)} />

        <div className="card" style={{ padding: 40 }}>
          {step === 1 && (
            <Step1Account
              state={state}
              update={update}
              onNext={(id) => {
                setUserId(id);
                setStep(2);
              }}
            />
          )}
          {step === 2 && userId && (
            <Step2BusinessInfo state={state} update={update} userId={userId} onNext={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && userId && (
            <Step3PlanSelection state={state} update={update} userId={userId} onNext={() => setStep(4)} onBack={() => setStep(2)} />
          )}
          {step === 4 && userId && (
            <Step4ServiceConfig state={state} update={update} userId={userId} onNext={() => setStep(5)} onBack={() => setStep(3)} />
          )}
          {step === 5 && userId && (
            <Step5AlexSetup state={state} update={update} userId={userId} onNext={() => setStep(6)} onBack={() => setStep(4)} />
          )}
          {step === 6 && userId && (
            <Step6GoogleIntegration state={state} update={update} userId={userId} onNext={() => setStep(7)} onBack={() => setStep(5)} />
          )}
          {step === 7 && userId && <Step7Review state={state} userId={userId} onBack={() => setStep(6)} />}
        </div>
      </div>
    </main>
  );
}
