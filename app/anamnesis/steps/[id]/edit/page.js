import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import StepForm from '@/components/anamnesis/StepForm';
import { notFound } from 'next/navigation';

const db = require('@/lib/db');

async function getStep(id) {
  const steps = await db.query(
    'SELECT * FROM anamnesis_steps WHERE id = ?',
    [id]
  );
  return steps[0] || null;
}

export default async function EditStepPage({ params }) {
  await requireUser();
  const { id } = await params;
  const step = await getStep(id);

  if (!step) {
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
              <Link
                href="/anamnesis/steps"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Step&apos;ler
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Düzenle</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Step Düzenle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <StepForm step={step} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

