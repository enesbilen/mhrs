import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CategoryForm from '@/components/anamnesis/CategoryForm';

export default async function NewCategoryPage() {
  await requireUser();

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
              <Link
                href="/anamnesis/categories"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Kategoriler
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Yeni Kategori</span>
            </div>
          </div>
        </div>
      </nav>

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
