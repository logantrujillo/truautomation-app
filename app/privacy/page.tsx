import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy – TruAutomation',
  description: 'Privacy Policy for TruAutomation Technologies.',
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '60px 20px 100px' }}>
      <div style={{ marginBottom: 40 }}>
        <Link href="/" style={{ color: 'var(--gray)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', marginBottom: 8 }}>
        Privacy <span style={{ color: 'var(--orange)' }}>Policy</span>
      </h1>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 48 }}>
        Last updated: July 5, 2026
      </p>

      <div
        className="card"
        style={{
          padding: '40px clamp(20px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.8)',
          fontSize: 16,
        }}
      >
        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>1. Introduction</h2>
          <p>
            TruAutomation Technologies ("TruAutomation," "we," "us," or "our") is committed to
            protecting your privacy. This Privacy Policy explains how we collect, use, and
            safeguard information when you use our services, including our client portal located
            at truautomation-app.vercel.app.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            2. Information We Collect
          </h2>
          <p style={{ marginBottom: 12 }}>We collect the following types of information:</p>
          <ul style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              Account information: your name, business name, contact information, email address,
              and encrypted password.
            </li>
            <li>
              Business information: your business address, service area, hours of operation, and
              service descriptions.
            </li>
            <li>
              Configuration information: emergency escalation contact, custom AI greetings, and
              FAQ content you provide for your AI receptionist.
            </li>
            <li>
              Payment information: processed securely by Stripe. We never store your card details
              on our servers.
            </li>
            <li>
              Call logs: caller phone numbers, call duration, timestamps, and call outcomes.
            </li>
            <li>Usage data: minutes of call time consumed on your account.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            3. Google Account Data
          </h2>
          <p style={{ marginBottom: 12 }}>
            If you choose to connect your Google account, we access:
          </p>
          <ul style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <li>Google Calendar, to check availability and book appointments on your behalf.</li>
            <li>Google Sheets, to log call data if you choose to enable that feature.</li>
          </ul>
          <p style={{ marginBottom: 12 }}>
            We only access what is needed to provide these features and never store or share any
            other Google data. Our use and transfer of information received from Google APIs
            adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--orange)' }}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. You can disconnect your Google account at
            any time from your dashboard settings.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            4. How We Use Information
          </h2>
          <p style={{ marginBottom: 12 }}>We use the information we collect to:</p>
          <ul style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Operate Alex, your AI receptionist.</li>
            <li>Book appointments on your behalf.</li>
            <li>Provide and maintain your client dashboard.</li>
            <li>Process payments for your subscription.</li>
            <li>Send transactional and account-related emails.</li>
            <li>Improve and develop our services.</li>
            <li>Comply with applicable legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            5. Call Recording
          </h2>
          <p>
            Calls are processed by VAPI to generate transcripts and enable Alex to respond to
            callers. Clients are responsible for informing their callers that they may be
            interacting with an AI system, as required by applicable laws in their jurisdiction.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            6. Third Party Providers
          </h2>
          <p style={{ marginBottom: 12 }}>
            We share data with the following third-party providers in order to deliver our
            services:
          </p>
          <ul style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Supabase – database and authentication.</li>
            <li>Stripe – payment processing.</li>
            <li>VAPI – AI call handling and transcription.</li>
            <li>Twilio – phone number provisioning and call routing.</li>
            <li>Resend – transactional email delivery.</li>
            <li>Google – calendar and sheets integration, only if you connect your account.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            7. Data Security
          </h2>
          <p>
            We use row level security to ensure your data is only accessible to you, HTTPS
            encryption for all data in transit, and Supabase Auth for secure authentication.
            Stripe handles all payment card data directly — we never receive or store your card
            details.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            8. Data Retention
          </h2>
          <p>
            We retain your data for as long as your account remains active. If you cancel your
            account, your data will be deleted within 30 days of cancellation.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            9. Your Rights
          </h2>
          <p>
            You have the right to access, correct, or delete your data, disconnect your Google
            account, and opt out of non-essential emails. To exercise any of these rights, contact
            us at{' '}
            <a href="mailto:info@truautomationtechnologies.com" style={{ color: 'var(--orange)' }}>
              info@truautomationtechnologies.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            10. Children's Privacy
          </h2>
          <p>Our services are not directed to individuals under the age of 18.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            11. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Users will be notified by email
            of any significant changes.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 14 }}>
            12. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:info@truautomationtechnologies.com" style={{ color: 'var(--orange)' }}>
              info@truautomationtechnologies.com
            </a>
            <br />
            TruAutomation Technologies
            <br />
            Seattle, Washington
          </p>
        </section>
      </div>
    </main>
  );
}
