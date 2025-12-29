import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import PatientList from '@/components/patients/PatientList';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getPatients() {
  return await db.query(
    `SELECT p.*, u.username as created_by_name
     FROM patients p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.archived = FALSE
     ORDER BY p.created_at DESC`
  );
}

export default async function PatientsPage() {
  await requireUser();
  const patients = await getPatients();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi' }
      ]} />

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Hasta Listesi</h2>
                <p className="text-gray-600">Aktif hasta kayıtlarını görüntüleyin ve yönetin</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/patients/archived"
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span>Arşivlenen Hastalar</span>
                </Link>
                <Link
                  href="/patients/new"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Yeni Hasta Ekle</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <PatientList patients={patients} />
          </div>
        </div>
      </main>
    </div>
  );
}
