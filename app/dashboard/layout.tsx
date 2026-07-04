import { redirect } from 'next/navigation';
import { getCurrentClient } from '@/lib/auth';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const client = await getCurrentClient();

  if (!client) {
    redirect('/login');
  }

  if (client.status !== 'active') {
    // Signup was started but payment hasn't completed (or was reversed).
    redirect('/signup');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <DashboardNav businessName={client.business_name} />
      <div style={{ flex: 1, padding: '32px 40px', maxWidth: 1100 }}>{children}</div>
    </div>
  );
}
