'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';

import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';
const QUESTION_TYPES = {
  yes_no: 'Evet/Hayır',
  yes_no_with_note: 'Evet/Hayır + Açıklama',
  text_input: 'Metin Girişi',
  single_choice: 'Tek Seçim',
  multiple_choice: 'Çoklu Seçim',
  medication_list: 'İlaç Listesi',
};

const CRITERIA_LABELS = {
  age_under_4: '4 yaş altına sorulamaz',
  consciousness_closed: 'Bilinç kapalı - sözel iletişim sorulamaz',
  developmental_neurological: 'Gelişimsel/nörolojik durum nedeniyle değerlendirilemez',
};

export default function QuestionList({ questions: initialQuestions, categories, sortBy = 'id', sortOrder = 'desc' }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);

  // initialQuestions değiştiğinde state'i güncelle (sıralama değiştiğinde)
  // initialQuestions'ın sıralamasını string olarak karşılaştır
  const initialQuestionsSortKey = useMemo(() => {
    return initialQuestions.map(q => `${q.id}-${q.order_index || 0}`).join('|');
  }, [initialQuestions]);

  const prevSortKeyRef = useRef(initialQuestionsSortKey);

  useEffect(() => {
    // Sadece sıralama gerçekten değiştiyse güncelle
    if (prevSortKeyRef.current !== initialQuestionsSortKey) {
      setQuestions(initialQuestions);
      prevSortKeyRef.current = initialQuestionsSortKey;
    }
  }, [initialQuestions, initialQuestionsSortKey]);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, questionId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [filterType, setFilterType] = useState('all');
  const [filterRequired, setFilterRequired] = useState('all');

  // Helper functions for client-side sorting
  const getCriteriaSortValue = (question) => {
    if (!question.criteria || question.criteria.length === 0) return '';
    return question.criteria.sort().join(',');
  };

  const getDiagnosesSortValue = (question) => {
    if (!question.relatedDiagnoses || question.relatedDiagnoses.length === 0) return '';
    return question.relatedDiagnoses.map(d => d.name).sort().join(',');
  };

  // Filter and sort logic
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = questions.filter((q) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.category_name && q.category_name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const categoryMatch =
        filterCategory === 'all' || q.category_id == filterCategory;

      // Type filter
      const typeMatch =
        filterType === 'all' || q.question_type === filterType;

      // Required filter
      const requiredMatch =
        filterRequired === 'all' ||
        (filterRequired === 'required' && q.is_required) ||
        (filterRequired === 'optional' && !q.is_required);

      return searchMatch && categoryMatch && typeMatch && requiredMatch;
    });

    // Client-side sorting for criteria and diagnoses
    if (sortBy === 'criteria' || sortBy === 'diagnoses') {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'criteria') {
          aValue = getCriteriaSortValue(a);
          bValue = getCriteriaSortValue(b);
        } else {
          aValue = getDiagnosesSortValue(a);
          bValue = getDiagnosesSortValue(b);
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [questions, searchTerm, filterCategory, filterType, filterRequired, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterType('all');
    setFilterRequired('all');
  };

  const getSortUrl = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    return `/anamnesis/questions?sortBy=${field}&sortOrder=${newOrder}`;
  };

  const SortButton = ({ field, label }) => {
    const isActive = sortBy === field;
    const currentOrder = isActive ? sortOrder : 'desc';
    return (
      <Link
        href={getSortUrl(field)}
        className="flex items-center space-x-1 hover:text-gray-900 focus:outline-none"
      >
        <span>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? (
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
      </Link>
    );
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({ isOpen: true, questionId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.questionId;
    setConfirmDialog({ isOpen: false, questionId: null });
    setDeleting(id);

    try {
      const response = await fetch(`/api/anamnesis/questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== id));
        setAlertDialog({
          isOpen: true,
          message: 'Soru başarıyla silindi',
          variant: 'success',
        });
        router.refresh();
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Soru silinemedi',
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
        searchPlaceholder="Soru metni veya kategori ara..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'category',
            label: 'Kategori',
            value: filterCategory,
            options: [
              { value: 'all', label: 'Tümü' },
              ...categories.map((cat) => ({
                value: cat.id.toString(),
                label: cat.name,
              })),
            ],
            onChange: setFilterCategory,
          },
          {
            id: 'type',
            label: 'Tip',
            value: filterType,
            options: [
              { value: 'all', label: 'Tümü' },
              { value: 'yes_no', label: 'Evet/Hayır' },
              { value: 'yes_no_with_note', label: 'Evet/Hayır + Açıklama' },
              { value: 'text_input', label: 'Metin' },
              { value: 'single_choice', label: 'Tek Seçim' },
              { value: 'multiple_choice', label: 'Çoklu Seçim' },
              { value: 'medication_list', label: 'İlaç Listesi' },
            ],
            onChange: setFilterType,
          },
          {
            id: 'required',
            label: 'Zorunluluk',
            value: filterRequired,
            options: [
              { value: 'all', label: 'Tümü' },
              { value: 'required', label: 'Zorunlu' },
              { value: 'optional', label: 'Opsiyonel' },
            ],
            onChange: setFilterRequired,
          },
        ]}
        onClearFilters={handleClearFilters}
        totalCount={questions.length}
        filteredCount={filteredAndSortedQuestions.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="order_index" label="Sıra" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="question" label="Soru" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="category" label="Kategori" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="type" label="Tip" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="required" label="Zorunlu" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="criteria" label="Kriterler" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="diagnoses" label="İlişkili Tanılar" />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedQuestions.map((question, index) => (
              <tr key={question.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {question.order_index || index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-md">
                    {question.question_text}
                    {question.options && question.options.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Seçenekler: {question.options.join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {question.category_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {QUESTION_TYPES[question.question_type]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {question.is_required ? (
                    <span className="text-red-600">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {question.criteria && question.criteria.length > 0 ? (
                    <div className="text-xs space-y-1">
                      {question.criteria.map((c, i) => (
                        <div key={i} className="bg-yellow-100 px-2 py-1 rounded">
                          {CRITERIA_LABELS[c] || c}
                        </div>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {question.relatedDiagnoses && question.relatedDiagnoses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {question.relatedDiagnoses.map((diagnosis) => (
                        <Link
                          key={diagnosis.id}
                          href={`/diagnoses/${diagnosis.id}/criteria`}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                          title={`${diagnosis.name} tanısının kriterlerini görüntüle`}
                        >
                          {diagnosis.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/anamnesis/questions/${question.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(question.id)}
                      disabled={deleting === question.id}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors duration-200 border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sil"
                    >
                      {deleting === question.id ? (
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
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedQuestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterCategory !== 'all' || filterType !== 'all' || filterRequired !== 'all'
              ? 'Arama kriterlerine uygun soru bulunamadı'
              : 'Henüz soru bulunmuyor'}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, questionId: null })}
        onConfirm={handleDeleteConfirm}
        title="Soruyu Sil"
        message="Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
