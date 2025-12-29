import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import UserList from '@/components/admin/UserList';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getUsers() {
  return await db.query(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
  );
}

export default async function UsersPage() {
  await requireAdmin();
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Kullanıcı Yönetimi' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
            <Link
              href="/admin/users/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yeni Kullanıcı Ekle
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <UserList users={users} />
          </div>
        </div>
      </main>
    </div>
  );
}
