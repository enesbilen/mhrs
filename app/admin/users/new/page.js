import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import UserForm from '@/components/admin/UserForm';
import Header from '@/components/common/Header';

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Kullanıcı Yönetimi', href: '/admin/users' },
        { label: 'Yeni Kullanıcı' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Yeni Kullanıcı Ekle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <UserForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
