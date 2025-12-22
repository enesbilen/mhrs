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
  { value: 'age_under_4', label: '4 yaş altına sorulamaz' },
  {
    value: 'consciousness_closed',
    label: 'Bilinç kapalı - sözel iletişim sorulamaz',
  },
  {
    value: 'developmental_neurological',
    label: 'Gelişimsel/nörolojik durum nedeniyle değerlendirilemez',
  },
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

  const needsOptions = ['single_choice', 'multiple_choice'].includes(
    formData.question_type
  );

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
          Kriterler (Bu soru ne zaman gösterilmeyecek?)
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
