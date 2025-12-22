'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function StepList({ steps: initialSteps }) {
  const router = useRouter();
  const [steps, setSteps] = useState(initialSteps);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, stepId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort logic
  const filteredAndSortedSteps = useMemo(() => {
    let filtered = steps.filter((step) => {
      const searchMatch =
        !searchTerm ||
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (step.description && step.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return searchMatch;
    });

    // Sort logic
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at || 0).getTime();
          bValue = new Date(b.updated_at || b.created_at || 0).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'order_index':
          aValue = a.order_index || 0;
          bValue = b.order_index || 0;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [steps, searchTerm, sortField, sortOrder]);

  const SortButton = ({ field, children }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center space-x-1 hover:text-gray-900 focus:outline-none"
      >
        <span>{children}</span>
        {isActive ? (
          sortOrder === 'asc' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </button>
    );
  };

  const handleDelete = async (stepId) => {
    setDeleting(stepId);
    try {
      const response = await fetch(`/api/anamnesis/steps/${stepId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSteps(steps.filter((s) => s.id !== stepId));
        setAlertDialog({
          isOpen: true,
          message: 'Step başarıyla silindi',
          variant: 'success',
        });
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Step silinemedi',
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
      setConfirmDialog({ isOpen: false, stepId: null });
    }
  };

  return (
    <>
      <TableFilter
        searchPlaceholder="Step ara..."
        onSearchChange={setSearchTerm}
        totalCount={steps.length}
        filteredCount={filteredAndSortedSteps.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="order_index">Sıra</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="name">Ad</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Açıklama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori Sayısı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="updated_at">Güncellenme</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="created_at">Oluşturulma</SortButton>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedSteps.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz step bulunmuyor'}
                </td>
              </tr>
            ) : (
              filteredAndSortedSteps.map((step) => (
                <tr key={step.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.order_index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {step.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {step.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.category_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.updated_at
                      ? new Date(step.updated_at).toLocaleString('tr-TR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.created_at
                      ? new Date(step.created_at).toLocaleString('tr-TR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/anamnesis/steps/${step.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Düzenle
                    </Link>
                    <button
                      onClick={() => setConfirmDialog({ isOpen: true, stepId: step.id })}
                      disabled={deleting === step.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === step.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, stepId: null })}
        onConfirm={() => handleDelete(confirmDialog.stepId)}
        title="Step Sil"
        message="Bu step'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Başarılı'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </>
  );
}

