'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function ArchivedPatientList({ patients: initialPatients }) {
  const router = useRouter();
  const [patients, setPatients] = useState(initialPatients);
  const [restoring, setRestoring] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [restoreDialog, setRestoreDialog] = useState({ isOpen: false, patientId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

  // Filter logic
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        patient.file_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.bed_no && patient.bed_no.toLowerCase().includes(searchTerm.toLowerCase()));

      // Gender filter
      const genderMatch = genderFilter === 'all' || patient.gender === genderFilter;

      return searchMatch && genderMatch;
    });
  }, [patients, searchTerm, genderFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleRestoreClick = (id) => {
    setRestoreDialog({ isOpen: true, patientId: id });
  };

  const handleRestoreConfirm = async () => {
    const id = restoreDialog.patientId;
    setRestoreDialog({ isOpen: false, patientId: null });
    setRestoring(id);

    try {
      const response = await fetch(`/api/patients/${id}/restore`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setPatients(patients.filter((patient) => patient.id !== id));
        setAlertDialog({
          isOpen: true,
          message: 'Hasta arşivden çıkarıldı',
          variant: 'success',
        });
        router.refresh();
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Hasta arşivden çıkarılamadı',
          variant: 'error',
        });
      }
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        message: 'Bir hata oluştu',
        variant: 'error',
      });
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <TableFilter
        searchPlaceholder="Dosya no, hasta adı veya yatak no ara..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'gender',
            label: 'Cinsiyet',
            value: genderFilter,
            options: [
              { value: 'all', label: 'Tümü' },
              { value: 'Kız', label: 'Kız' },
              { value: 'Erkek', label: 'Erkek' },
            ],
            onChange: setGenderFilter,
          },
        ]}
        onClearFilters={handleClearFilters}
        totalCount={patients.length}
        filteredCount={filteredPatients.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dosya No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hasta Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cinsiyet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yaş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yatak No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arşivlenme Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arşivleme Nedeni
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {patient.file_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.first_name} {patient.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calculateAge(patient.birth_date)} yaş
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.bed_no || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.archived_at
                    ? new Date(patient.archived_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {patient.archive_reason || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    Görüntüle
                  </Link>
                  <button
                    onClick={() => handleRestoreClick(patient.id)}
                    disabled={restoring === patient.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    {restoring === patient.id ? 'Geri Yükleniyor...' : 'Arşivden Çıkar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || genderFilter !== 'all'
              ? 'Arama kriterlerine uygun arşivlenen hasta bulunamadı'
              : 'Henüz arşivlenen hasta kaydı bulunmuyor'}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={restoreDialog.isOpen}
        onClose={() => setRestoreDialog({ isOpen: false, patientId: null })}
        onConfirm={handleRestoreConfirm}
        title="Hastayı Arşivden Çıkar"
        message="Bu hastayı arşivden çıkarmak istediğinizden emin misiniz?"
        confirmText="Arşivden Çıkar"
        cancelText="İptal"
        variant="info"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Başarılı'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
}

