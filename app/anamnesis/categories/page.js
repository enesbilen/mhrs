import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CategoryList from '@/components/anamnesis/CategoryList';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getCategories() {
  const categories = await db.query(
    `SELECT c.*, s.name as step_name, s.order_index as step_order, s.description as step_description
     FROM anamnesis_categories c
     LEFT JOIN anamnesis_steps s ON c.step_id = s.id
     ORDER BY c.updated_at DESC, c.created_at DESC`
  );
  
  // Get question count for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await db.query(
        'SELECT COUNT(*) as count FROM anamnesis_questions WHERE category_id = ?',
        [cat.id]
      );
      return {
        ...cat,
        question_count: count[0].count,
      };
    })
  );
  
  return categoriesWithCounts;
}

export default async function CategoriesPage() {
  await requireUser();
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Anamnez Soruları', href: '/anamnesis/questions' },
        { label: 'Kategoriler' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Anamnez Kategorileri Yönetimi</h2>
            <div className="flex space-x-3">
              <Link
                href="/anamnesis/steps"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Aşama Yönetimi
              </Link>
              <Link
                href="/anamnesis/categories/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yeni Kategori Ekle
              </Link>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <CategoryList categories={categories} />
          </div>
        </div>
      </main>
    </div>
  );
}
