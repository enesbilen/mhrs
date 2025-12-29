import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import ArchivedPatientList from '@/components/patients/ArchivedPatientList';
import Header from '@/components/common/Header';

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
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi', href: '/patients' },
        { label: 'Arşivlenen Hastalar' }
      ]} />

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

