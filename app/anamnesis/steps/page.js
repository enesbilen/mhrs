import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import StepList from '@/components/anamnesis/StepList';

const db = require('@/lib/db');

async function getSteps() {
  const steps = await db.query(
    'SELECT * FROM anamnesis_steps ORDER BY updated_at DESC, created_at DESC'
  );
  
  // Get category count for each step
  const stepsWithCounts = await Promise.all(
    steps.map(async (step) => {
      const count = await db.query(
        'SELECT COUNT(*) as count FROM anamnesis_categories WHERE step_id = ?',
        [step.id]
      );
      return {
        ...step,
        category_count: count[0].count,
      };
    })
  );
  
  return stepsWithCounts;
}

export default async function StepsPage() {
  await requireUser();
  const steps = await getSteps();

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
              <span className="ml-4 text-gray-700">Step&apos;ler</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Anamnez Step&apos;leri Yönetimi</h2>
            <div className="flex space-x-3">
              <Link
                href="/anamnesis/categories"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Kategori Yönetimi
              </Link>
              <Link
                href="/anamnesis/steps/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yeni Step Ekle
              </Link>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <StepList steps={steps} />
          </div>
        </div>
      </main>
    </div>
  );
}

