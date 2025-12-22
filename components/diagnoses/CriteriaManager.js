'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

// Dynamic import to avoid SSR hydration issues
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 animate-pulse">
      <span className="text-gray-400">Yükleniyor...</span>
    </div>
  ),
});

export default function CriteriaManager({
  diagnosisId,
  existingCriteria: initialCriteria,
  availableQuestions,
}) {
  const router = useRouter();
  const [criteria, setCriteria] = useState(initialCriteria);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [acceptedValues, setAcceptedValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, criterionId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

  const selectedQuestionData = availableQuestions.find(
    (q) => q.id == selectedQuestion
  );

  // Prepare options for react-select
  const questionOptions = availableQuestions.map((q) => ({
    value: q.id,
    label: q.category_name ? `[${q.category_name}] ${q.question_text}` : q.question_text,
    question: q,
  }));

  const selectedQuestionOption = selectedQuestion
    ? questionOptions.find((opt) => opt.value == selectedQuestion)
    : null;

  const handleAddCriterion = async () => {
    if (!selectedQuestion || acceptedValues.length === 0) {
      setAlertDialog({
        isOpen: true,
        message: 'Lütfen bir soru seçin ve kabul edilen cevapları belirtin',
        variant: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: selectedQuestion,
          accepted_values: acceptedValues,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new criterion to state immediately
        if (data.criterion) {
          // Check if updating existing criterion
          const existingIndex = criteria.findIndex(c => c.question_id === data.criterion.question_id);
          if (existingIndex >= 0) {
            // Update existing
            const newCriteria = [...criteria];
            newCriteria[existingIndex] = data.criterion;
            setCriteria(newCriteria);
          } else {
            // Add new
            setCriteria([...criteria, data.criterion]);
          }
        }

        setAlertDialog({
          isOpen: true,
          message: 'Kriter başarıyla eklendi',
          variant: 'success',
        });
        setSelectedQuestion('');
        setAcceptedValues([]);
        router.refresh();
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Kriter eklenemedi',
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
      setLoading(false);
    }
  };

  const handleDeleteClick = (criterionId) => {
    setConfirmDialog({ isOpen: true, criterionId });
  };

  const handleRemoveCriterion = async () => {
    const criterionId = confirmDialog.criterionId;
    setConfirmDialog({ isOpen: false, criterionId: null });

    try {
      const response = await fetch(
        `/api/diagnoses/${diagnosisId}/criteria/${criterionId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        setCriteria(criteria.filter((c) => c.id !== criterionId));
        setAlertDialog({
          isOpen: true,
          message: 'Kriter başarıyla kaldırıldı',
          variant: 'success',
        });
        router.refresh();
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Kriter kaldırılamadı',
          variant: 'error',
        });
      }
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        message: 'Bir hata oluştu',
        variant: 'error',
      });
    }
  };

  const toggleAcceptedValue = (value) => {
    if (acceptedValues.includes(value)) {
      setAcceptedValues(acceptedValues.filter((v) => v !== value));
    } else {
      setAcceptedValues([...acceptedValues, value]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Criteria */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium mb-4">
            Tanımlanmış Kriterler ({criteria.length})
          </h3>

          {criteria.length === 0 ? (
            <p className="text-gray-500">
              Henüz kriter eklenmemiş. Aşağıdan soru ekleyerek başlayın.
            </p>
          ) : (
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {criterion.question_text}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Kabul edilen cevaplar:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {criterion.accepted_values.map((val, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(criterion.id)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add New Criterion */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium mb-4">Yeni Kriter Ekle</h3>

          <div className="space-y-4">
            {/* Question Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soru Seçin
              </label>
              <Select
                value={selectedQuestionOption}
                onChange={(option) => {
                  setSelectedQuestion(option?.value || '');
                  setAcceptedValues([]);
                }}
                options={questionOptions}
                isSearchable={true}
                isClearable={true}
                placeholder="Soru ara veya seçiniz..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '38px',
                    borderColor: '#d1d5db',
                    '&:hover': {
                      borderColor: '#9ca3af',
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: '#2563eb',
                    primary25: '#dbeafe',
                    primary50: '#bfdbfe',
                    primary75: '#93c5fd',
                  },
                })}
              />
            </div>

            {/* Accepted Values Selection */}
            {selectedQuestionData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kabul Edilen Cevaplar (Bu tanı için hangi cevaplar kriter sayılsın?)
                </label>

                {selectedQuestionData.question_type === 'yes_no' ||
                selectedQuestionData.question_type === 'yes_no_with_note' ? (
                  <div className="space-y-2">
                    {['Evet', 'Hayır'].map((val) => (
                      <label key={val} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={acceptedValues.includes(val)}
                          onChange={() => toggleAcceptedValue(val)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{val}</span>
                      </label>
                    ))}
                  </div>
                ) : selectedQuestionData.question_type === 'text_input' ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Beklenen değeri yazın..."
                      value={acceptedValues[0] || ''}
                      onChange={(e) => setAcceptedValues([e.target.value])}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Metin soruları için tam eşleşme aranır
                    </p>
                  </div>
                ) : selectedQuestionData.options ? (
                  <div className="space-y-2">
                    {selectedQuestionData.options.map((opt) => (
                      <label key={opt} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={acceptedValues.includes(opt)}
                          onChange={() => toggleAcceptedValue(opt)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Bu soru tipi için kriter tanımlanamıyor
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleAddCriterion}
              disabled={loading || !selectedQuestion || acceptedValues.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ekleniyor...' : 'Kriter Ekle'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, criterionId: null })}
        onConfirm={handleRemoveCriterion}
        title="Kriteri Kaldır"
        message="Bu kriteri kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Kaldır"
        cancelText="İptal"
        variant="danger"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : alertDialog.variant === 'warning' ? 'Uyarı' : 'Başarılı'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
}
