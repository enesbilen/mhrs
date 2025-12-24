'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR hydration issues
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 animate-pulse">
      <span className="text-gray-400">Yükleniyor...</span>
    </div>
  ),
});

const QUESTION_TYPES = [
  { value: 'yes_no', label: 'Evet/Hayır' },
  { value: 'yes_no_with_note', label: 'Evet/Hayır + Açıklama' },
  { value: 'text_input', label: 'Metin Girişi' },
  { value: 'single_choice', label: 'Tek Seçim' },
  { value: 'multiple_choice', label: 'Çoklu Seçim' },
  { value: 'medication_list', label: 'İlaç Listesi' },
];

const CRITERIA_OPTIONS = [
  { value: 'age_under_4', label: '4 yaş altına sorulamaz' }
];

export default function QuestionForm({ categories, question = null, defaultOrderIndex = 0 }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category_id: question?.category_id || '',
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'yes_no',
    is_required: question?.is_required || false,
    order_index: question?.order_index || defaultOrderIndex,
  });
  const [options, setOptions] = useState(question?.options || []);
  const [newOption, setNewOption] = useState('');
  const [criteria, setCriteria] = useState(question?.criteria || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [conditions, setConditions] = useState([]);

  const needsOptions = ['single_choice', 'multiple_choice'].includes(
    formData.question_type
  );

  // Fetch all questions for conditional logic
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/anamnesis/questions');
        if (response.ok) {
          const data = await response.json();
          // Exclude current question if editing
          const filtered = question
            ? data.filter(q => q.id !== question.id)
            : data;
          setAllQuestions(filtered);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    fetchQuestions();
  }, [question]);

  // Fetch existing conditions if editing
  useEffect(() => {
    const fetchConditions = async () => {
      if (question?.id) {
        try {
          const response = await fetch(`/api/anamnesis/questions/${question.id}/conditions`);
          if (response.ok) {
            const data = await response.json();
            // Parse condition_value from JSON string to array
            const parsedConditions = data.map(cond => ({
              ...cond,
              condition_value: typeof cond.condition_value === 'string'
                ? JSON.parse(cond.condition_value)
                : (Array.isArray(cond.condition_value) ? cond.condition_value : [])
            }));
            setConditions(parsedConditions);
          }
        } catch (error) {
          console.error('Error fetching conditions:', error);
        }
      }
    };
    fetchConditions();
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (needsOptions && options.length === 0) {
      setError('Seçenekli sorular için en az bir seçenek gerekli');
      setLoading(false);
      return;
    }

    try {
      const url = question
        ? `/api/anamnesis/questions/${question.id}`
        : '/api/anamnesis/questions';
      const method = question ? 'PUT' : 'POST';

      const body = {
        ...formData,
        options: needsOptions ? options : null,
        criteria: criteria.length > 0 ? criteria : null,
        conditions: conditions,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/anamnesis/questions');
        router.refresh();
      } else {
        setError(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const toggleCriteria = (value) => {
    if (criteria.includes(value)) {
      setCriteria(criteria.filter((c) => c !== value));
    } else {
      setCriteria([...criteria, value]);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        depends_on_question_id: '',
        action: 'hide',
        condition_value: [], // Now stores array of selected values
      },
    ]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, value) => {
    const updated = [...conditions];
    updated[index][field] = value;

    // Reset condition_value when question changes
    if (field === 'depends_on_question_id') {
      updated[index].condition_value = [];
    }

    setConditions(updated);
  };

  const toggleConditionValue = (conditionIndex, value) => {
    const updated = [...conditions];
    const currentValues = Array.isArray(updated[conditionIndex].condition_value)
      ? updated[conditionIndex].condition_value
      : [];

    const selectedQuestion = allQuestions.find(
      (q) => q.id == updated[conditionIndex].depends_on_question_id
    );

    // For single choice questions (yes_no, yes_no_with_note, single_choice)
    if (selectedQuestion &&
        (selectedQuestion.question_type === 'yes_no' ||
         selectedQuestion.question_type === 'yes_no_with_note' ||
         selectedQuestion.question_type === 'single_choice')) {
      // Replace with single value
      updated[conditionIndex].condition_value = [value];
    } else {
      // For multiple choice, toggle the value
      if (currentValues.includes(value)) {
        updated[conditionIndex].condition_value = currentValues.filter(v => v !== value);
      } else {
        updated[conditionIndex].condition_value = [...currentValues, value];
      }
    }

    setConditions(updated);
  };

  const getQuestionOptions = (questionId) => {
    const q = allQuestions.find((q) => q.id == questionId);
    if (!q) return [];

    if (q.question_type === 'yes_no' || q.question_type === 'yes_no_with_note') {
      return ['Evet', 'Hayır'];
    } else if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
      return q.options || [];
    }
    return [];
  };

  const getQuestionType = (questionId) => {
    const q = allQuestions.find((q) => q.id == questionId);
    return q?.question_type || null;
  };

  // Prepare options for react-select
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const selectedCategory = formData.category_id
    ? categoryOptions.find((opt) => opt.value === formData.category_id)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori
        </label>
        <Select
          value={selectedCategory}
          onChange={(option) =>
            setFormData({ ...formData, category_id: option?.value || '' })
          }
          options={categoryOptions}
          isSearchable={true}
          isClearable={true}
          placeholder="Kategori ara veya seçiniz..."
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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Soru Metni *
        </label>
        <textarea
          required
          rows={2}
          value={formData.question_text}
          onChange={(e) =>
            setFormData({ ...formData, question_text: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Soru Tipi *
          </label>
          <select
            required
            value={formData.question_type}
            onChange={(e) => {
              setFormData({ ...formData, question_type: e.target.value });
              // Clear options if switching away from choice types
              if (!['single_choice', 'multiple_choice'].includes(e.target.value)) {
                setOptions([]);
              }
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sıra
          </label>
          <input
            type="number"
            min="0"
            value={formData.order_index}
            onChange={(e) =>
              setFormData({
                ...formData,
                order_index: parseInt(e.target.value) || 0,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_required"
          checked={formData.is_required}
          onChange={(e) =>
            setFormData({ ...formData, is_required: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
          Zorunlu soru
        </label>
      </div>

      {/* Options for choice questions */}
      {needsOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seçenekler *
          </label>
          <div className="space-y-2">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {opt}
                </span>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Sil
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Yeni seçenek ekle..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addOption}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Koşullar (Bu soru ne zaman gösterilmeyecek?)
        </label>
        <div className="space-y-2">
          {CRITERIA_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center">
              <input
                type="checkbox"
                id={opt.value}
                checked={criteria.includes(opt.value)}
                onChange={() => toggleCriteria(opt.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={opt.value} className="ml-2 text-sm text-gray-700">
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Conditional Display */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Dinamik Görünürlük Koşulları
          </label>
          <button
            type="button"
            onClick={addCondition}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            + Koşul Ekle
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Bu sorunun hangi durumlarda gösterileceğini veya gizleneceğini belirleyin
        </p>

        {conditions.length === 0 ? (
          <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md">
            Henüz koşul eklenmedi. Bu soru her zaman görünür olacak.
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((condition, index) => {
              const selectedQuestion = allQuestions.find(
                (q) => q.id == condition.depends_on_question_id
              );
              const availableOptions = condition.depends_on_question_id
                ? getQuestionOptions(condition.depends_on_question_id)
                : [];
              const questionType = getQuestionType(condition.depends_on_question_id);
              const isMultipleChoice = questionType === 'multiple_choice';
              const currentValues = Array.isArray(condition.condition_value)
                ? condition.condition_value
                : [];

              return (
                <div
                  key={index}
                  className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Koşul #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Question Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Bağlı Soru
                      </label>
                      <Select
                        value={
                          condition.depends_on_question_id
                            ? {
                                value: condition.depends_on_question_id,
                                label: allQuestions.find(
                                  (q) => q.id == condition.depends_on_question_id
                                )?.question_text || '',
                              }
                            : null
                        }
                        onChange={(option) =>
                          updateCondition(
                            index,
                            'depends_on_question_id',
                            option?.value || ''
                          )
                        }
                        options={allQuestions.map((q) => ({
                          value: q.id,
                          label: q.question_text,
                        }))}
                        isSearchable={true}
                        isClearable={true}
                        placeholder="Soru ara veya seçiniz..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '38px',
                            fontSize: '0.875rem',
                            borderColor: '#d1d5db',
                            '&:hover': {
                              borderColor: '#9ca3af',
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                            fontSize: '0.875rem',
                          }),
                          option: (base) => ({
                            ...base,
                            fontSize: '0.875rem',
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

                    {/* Action Selection */}
                    {condition.depends_on_question_id && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Aksiyon
                        </label>
                        <select
                          value={condition.action}
                          onChange={(e) =>
                            updateCondition(index, 'action', e.target.value)
                          }
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="hide">Gizle</option>
                          <option value="show">Göster</option>
                        </select>
                      </div>
                    )}

                    {/* Options Selection */}
                    {condition.depends_on_question_id && availableOptions.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          {isMultipleChoice
                            ? 'Seçenekler (çoklu seçim yapabilirsiniz)'
                            : 'Seçenek (tekli seçim)'}
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                          {availableOptions.map((opt, i) => {
                            const isChecked = currentValues.includes(opt);
                            return (
                              <div key={i} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`cond-${index}-opt-${i}`}
                                  checked={isChecked}
                                  onChange={() => toggleConditionValue(index, opt)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`cond-${index}-opt-${i}`}
                                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                                >
                                  {opt}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    {selectedQuestion && currentValues.length > 0 && (
                      <div className="mt-3 text-xs text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                        <strong className="text-blue-900">Önizleme:</strong>
                        <p className="mt-1">
                          "{selectedQuestion.question_text.substring(0, 50)}
                          {selectedQuestion.question_text.length > 50 ? '...' : ''}"
                          sorusuna verilen cevap{' '}
                          <strong className="text-blue-900">
                            {currentValues.map((v, i) => (
                              <span key={i}>
                                "{v}"{i < currentValues.length - 1 ? ' veya ' : ''}
                              </span>
                            ))}
                          </strong>{' '}
                          {currentValues.length > 1 ? 'değerlerinden biri' : 'değeri'} ise,
                          bu soru{' '}
                          <strong className="text-blue-900">
                            {condition.action === 'hide' ? 'gizlenecek' : 'gösterilecek'}
                          </strong>
                          .
                        </p>
                      </div>
                    )}

                    {/* Warning for no selection */}
                    {condition.depends_on_question_id && currentValues.length === 0 && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠ En az bir seçenek işaretlemelisiniz
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : question ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
