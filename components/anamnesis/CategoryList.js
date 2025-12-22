'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function CategoryList({ categories: initialCategories }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [searchTerm, setSearchTerm] = useState('');
  const [stepFilter, setStepFilter] = useState('all');
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique steps for filter
  const uniqueSteps = useMemo(() => {
    const steps = [...new Set(categories.map(cat => cat.step_order || cat.step_id || cat.step || 1))].sort((a, b) => a - b);
    return steps;
  }, [categories]);

  // Filter and sort logic
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((category) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Step filter
      const stepMatch =
        stepFilter === 'all' ||
        (category.step_order || category.step_id || category.step || 1).toString() === stepFilter;

      return searchMatch && stepMatch;
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
        case 'step':
          aValue = a.step_order || a.step_id || a.step || 1;
          bValue = b.step_order || b.step_id || b.step || 1;
          break;
        case 'order_index':
          aValue = a.order_index || 0;
          bValue = b.order_index || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'question_count':
          aValue = a.question_count || 0;
          bValue = b.question_count || 0;
          break;
        default:
          aValue = new Date(a.updated_at || a.created_at || 0).getTime();
          bValue = new Date(b.updated_at || b.created_at || 0).getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [categories, searchTerm, stepFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStepFilter('all');
  };

  const SortButton = ({ field, label }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center space-x-1 hover:text-gray-900 focus:outline-none"
      >
        <span>{label}</span>
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

  const handleDeleteClick = (id) => {
    setConfirmDialog({ isOpen: true, categoryId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.categoryId;
    setConfirmDialog({ isOpen: false, categoryId: null });
    setDeleting(id);

    try {
      const response = await fetch(`/api/anamnesis/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== id));
        setAlertDialog({
          isOpen: true,
          message: 'Kategori başarıyla silindi',
          variant: 'success',
        });
        router.refresh();
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Kategori silinemedi',
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
        searchPlaceholder="Kategori adı ara..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'step',
            label: 'Step',
            value: stepFilter,
            options: [
              { value: 'all', label: 'Tümü' },
              ...uniqueSteps.map((step) => ({
                value: step.toString(),
                label: `Step ${step}`,
              })),
            ],
            onChange: setStepFilter,
          },
        ]}
        onClearFilters={handleClearFilters}
        totalCount={categories.length}
        filteredCount={filteredAndSortedCategories.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="step" label="Step" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="order_index" label="Sıra" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="name" label="Kategori Adı" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="question_count" label="İlişkili Soru Sayısı" />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCategories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.step_order || category.step_id || category.step || 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.order_index}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.question_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/anamnesis/categories/${category.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(category.id)}
                      disabled={deleting === category.id}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors duration-200 border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sil"
                    >
                      {deleting === category.id ? (
                        <>
                          <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Siliniyor...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Sil
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {categories.length === 0
              ? 'Henüz kategori bulunmuyor'
              : 'Filtre kriterlerine uygun kategori bulunamadı'}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, categoryId: null })}
        onConfirm={handleDeleteConfirm}
        title="Kategoriyi Sil"
        message="Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    </div>
  );
}
