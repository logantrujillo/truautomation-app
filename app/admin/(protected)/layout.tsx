import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

// Route group (protected) sits alongside app/admin/login/, which is NOT
// wrapped by this layout — otherwise the redirect below would loop
// against the login page itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <AdminNav email={admin.email} />
      <div style={{ flex: 1, padding: '32px 40px', maxWidth: 1300 }}>{children}</div>
    </div>
  );
}
