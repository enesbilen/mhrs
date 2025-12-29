import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CategoryForm from '@/components/anamnesis/CategoryForm';
import Header from '@/components/common/Header';

export default async function NewCategoryPage() {
  await requireUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Anamnez Soruları', href: '/anamnesis/questions' },
        { label: 'Kategoriler', href: '/anamnesis/categories' },
        { label: 'Yeni Kategori' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Yeni Kategori Ekle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <CategoryForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
