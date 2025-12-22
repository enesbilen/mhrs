'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export default function PatientList({ patients: initialPatients }) {
  const router = useRouter();
  const [patients, setPatients] = useState(initialPatients);
  const [archiving, setArchiving] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [archiveDialog, setArchiveDialog] = useState({ isOpen: false, patientId: null });
  const [archiveReason, setArchiveReason] = useState('');
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

  const handleArchiveClick = (id) => {
    setArchiveDialog({ isOpen: true, patientId: id });
    setArchiveReason('');
  };

  const handleArchiveConfirm = async () => {
    const id = archiveDialog.patientId;
    setArchiveDialog({ isOpen: false, patientId: null });
    setArchiving(id);

    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive_reason: archiveReason || null }),
      });

      if (response.ok) {
        setPatients(patients.filter((patient) => patient.id !== id));
        router.refresh();
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Hasta arşivlenemedi',
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
      setArchiving(null);
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
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors duration-200 border border-green-200 hover:border-green-300"
                    title="Görüntüle"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Görüntüle
                  </Link>
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </Link>
                  <button
                    onClick={() => handleArchiveClick(patient.id)}
                    disabled={archiving === patient.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 hover:text-orange-800 transition-colors duration-200 border border-orange-200 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Arşivle"
                  >
                    {archiving === patient.id ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Arşivleniyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Arşivle
                      </>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredPatients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || genderFilter !== 'all'
            ? 'Arama kriterlerine uygun hasta bulunamadı'
            : 'Henüz hasta kaydı bulunmuyor'}
        </div>
      )}
      </div>

      {/* Archive Dialog with custom input */}
      <Dialog
        open={archiveDialog.isOpen}
        onClose={() => setArchiveDialog({ isOpen: false, patientId: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Hastayı Arşivle
                </DialogTitle>
                <p className="mt-2 text-sm text-gray-600">
                  Bu hastayı arşivlemek istediğinizden emin misiniz?
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arşivleme Nedeni (Opsiyonel)
                  </label>
                  <textarea
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Arşivleme nedenini buraya yazabilirsiniz..."
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setArchiveDialog({ isOpen: false, patientId: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                Arşivle
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Bildirim'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
}
