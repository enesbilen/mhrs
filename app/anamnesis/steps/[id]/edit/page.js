import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import StepForm from '@/components/anamnesis/StepForm';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';

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
      <Header breadcrumbItems={[
        { label: 'Anamnez Soruları', href: '/anamnesis/questions' },
        { label: 'Kategoriler', href: '/anamnesis/categories' },
        { label: "Aşamalar", href: '/anamnesis/steps' },
        { label: 'Düzenle' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Aşama Düzenle</h2>

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

