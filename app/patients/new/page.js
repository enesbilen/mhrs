import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import PatientForm from '@/components/patients/PatientForm';
import Header from '@/components/common/Header';

export default async function NewPatientPage() {
  await requireUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi', href: '/patients' },
        { label: 'Yeni Hasta' }
      ]} />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Yeni Hasta Kaydı</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <PatientForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
