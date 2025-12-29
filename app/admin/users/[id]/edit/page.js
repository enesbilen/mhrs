import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import UserForm from '@/components/admin/UserForm';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getUser(id) {
  const users = await db.query(
    'SELECT id, username, email, role FROM users WHERE id = ?',
    [id]
  );
  return users.length > 0 ? users[0] : null;
}

export default async function EditUserPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Kullanıcı Yönetimi', href: '/admin/users' },
        { label: 'Düzenle' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">
            Kullanıcı Düzenle: {user.username}
          </h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <UserForm user={user} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
