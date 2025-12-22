'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertDialog from '@/components/common/AlertDialog';

export default function StepForm({ step = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: step?.name || '',
    description: step?.description || '',
    order_index: step?.order_index || 0,
  });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = step ? `/api/anamnesis/steps/${step.id}` : '/api/anamnesis/steps';
      const method = step ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertDialog({
          isOpen: true,
          message: step ? 'Step başarıyla güncellendi' : 'Step başarıyla oluşturuldu',
          variant: 'success',
        });

        setTimeout(() => {
          router.push('/anamnesis/steps');
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
            Step Adı *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Genel Değerlendirme"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Step açıklaması..."
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sıra Numarası *
          </label>
          <input
            type="number"
            required
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
          <p className="mt-1 text-sm text-gray-500">
            Step'lerin görünme sırasını belirler (küçük değerler önce gelir)
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
            {loading ? 'Kaydediliyor...' : step ? 'Güncelle' : 'Kaydet'}
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

