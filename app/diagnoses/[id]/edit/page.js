import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import DiagnosisForm from '@/components/diagnoses/DiagnosisForm';
import { notFound } from 'next/navigation';

const db = require('@/lib/db');

async function getDiagnosis(id) {
  const diagnoses = await db.query(
    'SELECT * FROM nurse_diagnoses WHERE id = ?',
    [id]
  );
  if (diagnoses.length === 0) return null;

  const definingCharacteristics = await db.query(
    'SELECT id, characteristic_text, order_index FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ? ORDER BY order_index ASC, id ASC',
    [id]
  );

  return {
    ...diagnoses[0],
    defining_characteristics: definingCharacteristics,
  };
}

export default async function EditDiagnosisPage({ params }) {
  await requireUser();
  const { id } = await params;
  const diagnosis = await getDiagnosis(id);

  if (!diagnosis) {
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
                href="/diagnoses"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Hemşire Tanıları
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Düzenle</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Tanı Düzenle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <DiagnosisForm 
                diagnosis={diagnosis} 
                definingCharacteristics={diagnosis.defining_characteristics || []}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
