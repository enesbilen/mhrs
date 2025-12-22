import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import DiagnosisList from '@/components/diagnoses/DiagnosisList';

const db = require('@/lib/db');

async function getDiagnoses() {
  const diagnoses = await db.query(
    'SELECT * FROM nurse_diagnoses ORDER BY id DESC'
  );

  // Get criteria count and defining characteristics for each diagnosis
  const diagnosesWithData = await Promise.all(
    diagnoses.map(async (d) => {
      const criteria = await db.query(
        'SELECT COUNT(*) as count FROM diagnosis_criteria WHERE diagnosis_id = ?',
        [d.id]
      );
      const definingCharacteristics = await db.query(
        'SELECT id, characteristic_text, order_index FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ? ORDER BY order_index ASC, id ASC',
        [d.id]
      );
      return {
        ...d,
        criteria_count: criteria[0].count,
        defining_characteristics: definingCharacteristics,
      };
    })
  );

  return diagnosesWithData;
}

export default async function DiagnosesPage() {
  await requireUser();
  const diagnoses = await getDiagnoses();

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
              <span className="ml-4 text-gray-700">Hemşire Tanıları</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hemşire Tanıları Yönetimi</h2>
            <Link
              href="/diagnoses/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yeni Tanı Ekle
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <DiagnosisList diagnoses={diagnoses} />
          </div>
        </div>
      </main>
    </div>
  );
}
