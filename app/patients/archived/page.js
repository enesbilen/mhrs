import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import ArchivedPatientList from '@/components/patients/ArchivedPatientList';

const db = require('@/lib/db');

async function getArchivedPatients() {
  return await db.query(
    `SELECT p.*, u.username as created_by_name
     FROM patients p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.archived = TRUE
     ORDER BY p.archived_at DESC`
  );
}

export default async function ArchivedPatientsPage() {
  await requireUser();
  const patients = await getArchivedPatients();

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
                href="/patients"
                className="ml-4 text-gray-700 hover:text-blue-600"
              >
                Hasta Yönetimi
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Arşivlenen Hastalar</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Arşivlenen Hastalar</h2>
            <Link
              href="/patients"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Aktif Hastalar
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ArchivedPatientList patients={patients} />
          </div>
        </div>
      </main>
    </div>
  );
}

