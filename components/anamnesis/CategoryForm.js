'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AlertDialog from '@/components/common/AlertDialog';

export default function CategoryForm({ category = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    step_id: category?.step_id || category?.step || null,
    order_index: category?.order_index || 0,
  });
  const [steps, setSteps] = useState([]);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch steps
    fetch('/api/anamnesis/steps')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSteps(data);
          // If no step_id is set and steps exist, set first step as default
          if (!formData.step_id && data.length > 0) {
            setFormData(prev => ({ ...prev, step_id: data[0].id }));
          }
        }
      })
      .catch(err => console.error('Error fetching steps:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category ? `/api/anamnesis/categories/${category.id}` : '/api/anamnesis/categories';
      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertDialog({
          isOpen: true,
          message: category ? 'Kategori başarıyla güncellendi' : 'Kategori başarıyla oluşturuldu',
          variant: 'success',
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push('/anamnesis/categories');
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
            Kategori Adı *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Genel Bilgiler"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Step *
          </label>
          <select
            required
            value={formData.step_id || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                step_id: parseInt(e.target.value) || null,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Step seçin...</option>
            {steps.map((step) => (
              <option key={step.id} value={step.id}>
                {step.name} {step.description ? `- ${step.description}` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Kategorinin hangi step'te görüneceğini belirler
          </p>
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
            Kategorilerin listede görünme sırasını belirler (küçük değerler önce gelir)
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
            {loading ? 'Kaydediliyor...' : category ? 'Güncelle' : 'Kaydet'}
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
