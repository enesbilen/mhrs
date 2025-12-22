import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CategoryList from '@/components/anamnesis/CategoryList';

const db = require('@/lib/db');

async function getCategories() {
  const categories = await db.query(
    'SELECT * FROM anamnesis_categories ORDER BY order_index ASC, id ASC'
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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold hover:text-blue-600">
                MHRS
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <Link
                href="/anamnesis/questions"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Anamnez Soruları
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Kategoriler</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Anamnez Kategorileri Yönetimi</h2>
            <Link
              href="/anamnesis/categories/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yeni Kategori Ekle
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <CategoryList categories={categories} />
          </div>
        </div>
      </main>
    </div>
  );
}
