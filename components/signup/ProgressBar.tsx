'use client';

const STEPS = [
  'Account',
  'Business Info',
  'Plan',
  'Services',
  'Alex Setup',
  'Google',
  'Review & Pay',
];

export default function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'todo';
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 6,
                  background: state === 'todo' ? 'rgba(255,255,255,0.06)' : 'var(--orange)',
                  color: state === 'todo' ? 'var(--gray)' : '#fff',
                  border: state === 'active' ? '2px solid var(--yellow)' : 'none',
                  boxShadow: state === 'active' ? '0 0 14px rgba(255,210,63,0.5)' : 'none',
                  transition: 'all .2s',
                }}
              >
                {state === 'done' ? '✓' : n}
              </div>
              <span
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: state === 'todo' ? 'var(--gray)' : 'var(--white)',
                  textAlign: 'center',
                  display: 'none',
                }}
                className="progress-label"
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--orange), var(--yellow))',
            transition: 'width .3s',
          }}
        />
      </div>
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 1 }}>
        Step {step} of {STEPS.length} — {STEPS[step - 1]}
      </p>
    </div>
  );
}
