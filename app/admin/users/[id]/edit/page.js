import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import UserForm from '@/components/admin/UserForm';
import { notFound } from 'next/navigation';

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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold hover:text-blue-600">
                MHRS
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <Link
                href="/admin/users"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Kullanıcı Yönetimi
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Düzenle</span>
            </div>
          </div>
        </div>
      </nav>

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
