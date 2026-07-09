import { redirect } from 'next/navigation';
import { isAdminSessionValid } from '@/lib/adminAuth';
import AdminNav from '@/components/admin/AdminNav';

// Route group (protected) sits alongside app/admin/login/, which is NOT
// wrapped by this layout — otherwise the redirect below would loop
// against the login page itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const valid = await isAdminSessionValid();

  if (!valid) {
    redirect('/admin/login');
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex' }}>
      <AdminNav />
      <div className="app-content" style={{ flex: 1, padding: '32px 40px', maxWidth: 1300, minWidth: 0 }}>{children}</div>
    </div>
  );
}
