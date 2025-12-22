'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function DiagnosisList({ diagnoses: initialDiagnoses }) {
  const router = useRouter();
  const [diagnoses, setDiagnoses] = useState(initialDiagnoses);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, diagnosisId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [characteristicsDialog, setCharacteristicsDialog] = useState({ isOpen: false, diagnosis: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [criteriaFilter, setCriteriaFilter] = useState('all');

  // Filter logic
  const filteredDiagnoses = useMemo(() => {
    return diagnoses.filter((diagnosis) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (diagnosis.description && diagnosis.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Criteria filter
      const criteriaMatch =
        criteriaFilter === 'all' ||
        (criteriaFilter === 'no_criteria' && diagnosis.criteria_count === 0) ||
        (criteriaFilter === 'has_criteria' && diagnosis.criteria_count > 0);

      return searchMatch && criteriaMatch;
    });
  }, [diagnoses, searchTerm, criteriaFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCriteriaFilter('all');
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({ isOpen: true, diagnosisId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.diagnosisId;
    setConfirmDialog({ isOpen: false, diagnosisId: null });
    setDeleting(id);

    try {
      const response = await fetch(`/api/diagnoses/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDiagnoses(diagnoses.filter((d) => d.id !== id));
        setAlertDialog({
          isOpen: true,
          message: 'Tanı başarıyla silindi',
          variant: 'success',
        });
        router.refresh();
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Tanı silinemedi',
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
      setDeleting(null);
    }
  };

  return (
    <div>
      <TableFilter
        searchPlaceholder="Tanı adı veya açıklama ara..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'criteria',
            label: 'Kriter Durumu',
            value: criteriaFilter,
            options: [
              { value: 'all', label: 'Tümü' },
              { value: 'has_criteria', label: 'Kriterli' },
              { value: 'no_criteria', label: 'Kritersiz' },
            ],
            onChange: setCriteriaFilter,
          },
        ]}
        onClearFilters={handleClearFilters}
        totalCount={diagnoses.length}
        filteredCount={filteredDiagnoses.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanı Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Açıklama
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Min. Kriter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanımlı Kriter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanımlayıcı Özellikler
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredDiagnoses.map((diagnosis) => (
            <tr key={diagnosis.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {diagnosis.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {diagnosis.description || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {diagnosis.min_criteria_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {diagnosis.criteria_count || 0}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {diagnosis.defining_characteristics && diagnosis.defining_characteristics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-w-md items-center">
                    {diagnosis.defining_characteristics.slice(0, 2).map((char) => (
                      <span
                        key={char.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 break-words"
                        title={char.characteristic_text}
                      >
                        {char.characteristic_text.length > 30 
                          ? `${char.characteristic_text.substring(0, 30)}...` 
                          : char.characteristic_text}
                      </span>
                    ))}
                    {diagnosis.defining_characteristics.length > 2 && (
                      <button
                        onClick={() => setCharacteristicsDialog({ isOpen: true, diagnosis })}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        +{diagnosis.defining_characteristics.length - 2} daha göster
                      </button>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/diagnoses/${diagnosis.id}/criteria`}
                  className="text-green-600 hover:text-green-900 mr-4"
                >
                  Kriterler
                </Link>
                <Link
                  href={`/diagnoses/${diagnosis.id}/edit`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Düzenle
                </Link>
                <button
                  onClick={() => handleDeleteClick(diagnosis.id)}
                  disabled={deleting === diagnosis.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleting === diagnosis.id ? 'Siliniyor...' : 'Sil'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredDiagnoses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || criteriaFilter !== 'all'
            ? 'Arama kriterlerine uygun tanı bulunamadı'
            : 'Henüz tanı bulunmuyor'}
        </div>
      )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, diagnosisId: null })}
        onConfirm={handleDeleteConfirm}
        title="Tanıyı Sil"
        message="Bu tanıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Başarılı'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />

      {/* Tanımlayıcı Özellikler Modal */}
      <Dialog
        open={characteristicsDialog.isOpen}
        onClose={() => setCharacteristicsDialog({ isOpen: false, diagnosis: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {characteristicsDialog.diagnosis?.name}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Tanımlayıcı Özellikler ({characteristicsDialog.diagnosis?.defining_characteristics?.length || 0})
              </p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {characteristicsDialog.diagnosis?.defining_characteristics && 
               characteristicsDialog.diagnosis.defining_characteristics.length > 0 ? (
                <div className="space-y-3">
                  {characteristicsDialog.diagnosis.defining_characteristics.map((char, index) => (
                    <div
                      key={char.id}
                      className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mr-3">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-800 flex-1 break-words">
                        {char.characteristic_text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Tanımlayıcı özellik bulunmuyor.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCharacteristicsDialog({ isOpen: false, diagnosis: null })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kapat
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
