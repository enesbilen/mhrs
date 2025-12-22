'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertDialog from '@/components/common/AlertDialog';

export default function DiagnosisForm({ diagnosis = null, definingCharacteristics: initialCharacteristics = [] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: diagnosis?.name || '',
    description: diagnosis?.description || '',
    min_criteria_count: diagnosis?.min_criteria_count || 2,
  });
  const [definingCharacteristics, setDefiningCharacteristics] = useState(
    initialCharacteristics.length > 0 
      ? initialCharacteristics.map(c => c.characteristic_text || c)
      : ['']
  );
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = diagnosis ? `/api/diagnoses/${diagnosis.id}` : '/api/diagnoses';
      const method = diagnosis ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          defining_characteristics: definingCharacteristics.filter(c => c.trim()),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertDialog({
          isOpen: true,
          message: diagnosis ? 'Tanı başarıyla güncellendi' : 'Tanı başarıyla oluşturuldu',
          variant: 'success',
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push('/diagnoses');
          router.refresh();
        }, 1500);
      } else {
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Bir hata oluştu',
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

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tanı Adı *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Örn: Beslenmede Dengesizlik: Beden gereksiniminden az"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Açıklama
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Tanı hakkında açıklama..."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Minimum Kriter Sayısı *
        </label>
        <input
          type="number"
          required
          min="1"
          value={formData.min_criteria_count}
          onChange={(e) =>
            setFormData({
              ...formData,
              min_criteria_count: parseInt(e.target.value) || 1,
            })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Bu tanının önerilmesi için kaç kriterin karşılanması gerektiğini belirtin
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanımlayıcı Özellikler
        </label>
        <div className="space-y-2">
          {definingCharacteristics.map((characteristic, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={characteristic}
                onChange={(e) => {
                  const newCharacteristics = [...definingCharacteristics];
                  newCharacteristics[index] = e.target.value;
                  setDefiningCharacteristics(newCharacteristics);
                }}
                placeholder="Örn: Abdominal kramp"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {definingCharacteristics.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setDefiningCharacteristics(definingCharacteristics.filter((_, i) => i !== index));
                  }}
                  className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  title="Kaldır"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDefiningCharacteristics([...definingCharacteristics, ''])}
            className="mt-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            + Özellik Ekle
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Bu tanı için gözlemlenebilen tanımlayıcı özellikleri ekleyin
        </p>
      </div>

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
          {loading ? 'Kaydediliyor...' : diagnosis ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
      </form>

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
