'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function CategoryList({ categories: initialCategories }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İlişkili Soru Sayısı
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
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

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz kategori bulunmuyor
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
