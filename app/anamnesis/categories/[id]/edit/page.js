import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CategoryForm from '@/components/anamnesis/CategoryForm';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getCategory(id) {
  const categories = await db.query(
    'SELECT * FROM anamnesis_categories WHERE id = ?',
    [id]
  );
  return categories[0] || null;
}

export default async function EditCategoryPage({ params }) {
  await requireUser();
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Anamnez Soruları', href: '/anamnesis/questions' },
        { label: 'Kategoriler', href: '/anamnesis/categories' },
        { label: 'Düzenle' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Kategori Düzenle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <CategoryForm category={category} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
