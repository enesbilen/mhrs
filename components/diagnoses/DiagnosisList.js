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
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Sort and filter logic
  const filteredDiagnoses = useMemo(() => {
    let filtered = diagnoses.filter((diagnosis) => {
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

    // Sort logic
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'name':
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
            break;
          case 'description':
            aValue = a.description?.toLowerCase() || '';
            bValue = b.description?.toLowerCase() || '';
            break;
          case 'min_criteria_count':
            aValue = a.min_criteria_count || 0;
            bValue = b.min_criteria_count || 0;
            break;
          case 'criteria_count':
            aValue = a.criteria_count || 0;
            bValue = b.criteria_count || 0;
            break;
          case 'defining_characteristics':
            aValue = a.defining_characteristics?.length || 0;
            bValue = b.defining_characteristics?.length || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort: most recently updated or created first
      filtered = [...filtered].sort((a, b) => {
        // Use updated_at if available, otherwise use created_at
        const aDate = a.updated_at ? new Date(a.updated_at) : (a.created_at ? new Date(a.created_at) : new Date(0));
        const bDate = b.updated_at ? new Date(b.updated_at) : (b.created_at ? new Date(b.created_at) : new Date(0));
        
        // Sort descending (newest first)
        return bDate - aDate;
      });
    }

    return filtered;
  }, [diagnoses, searchTerm, criteriaFilter, sortColumn, sortDirection]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCriteriaFilter('all');
    setSortColumn(null);
    setSortDirection('asc');
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
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
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('id')}
            >
              <div className="flex items-center gap-2">
                ID
                {sortColumn === 'id' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Tanı Adı
                {sortColumn === 'name' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('description')}
            >
              <div className="flex items-center gap-2">
                Açıklama
                {sortColumn === 'description' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('min_criteria_count')}
            >
              <div className="flex items-center gap-2">
                Min. Kriter
                {sortColumn === 'min_criteria_count' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('criteria_count')}
            >
              <div className="flex items-center gap-2">
                Tanımlı Kriter
                {sortColumn === 'criteria_count' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('defining_characteristics')}
            >
              <div className="flex items-center gap-2">
                Tanımlayıcı Özellikler
                {sortColumn === 'defining_characteristics' && (
                  <span className="text-gray-700">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
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
                {diagnosis.id}
              </td>
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
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/diagnoses/${diagnosis.id}/criteria`}
                    className="text-green-600 hover:text-green-900 transition-colors"
                    title="Kriterler"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </Link>
                  <Link
                    href={`/diagnoses/${diagnosis.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="Düzenle"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(diagnosis.id)}
                    disabled={deleting === diagnosis.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={deleting === diagnosis.id ? 'Siliniyor...' : 'Sil'}
                  >
                    {deleting === diagnosis.id ? (
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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
