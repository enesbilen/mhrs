'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientForm({ patient = null }) {
  const router = useRouter();

  // Format birth_date safely
  const formatBirthDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  const [formData, setFormData] = useState({
    file_no: patient?.file_no || '',
    bed_no: patient?.bed_no || '',
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    birth_date: formatBirthDate(patient?.birth_date),
    gender: patient?.gender || 'Kız',
    medical_diagnosis: patient?.medical_diagnosis || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = patient ? `/api/patients/${patient.id}` : '/api/patients';
      const method = patient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/patients');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="file_no"
            className="block text-sm font-medium text-gray-700"
          >
            Dosya No *
          </label>
          <input
            type="text"
            id="file_no"
            required
            value={formData.file_no}
            onChange={(e) =>
              setFormData({ ...formData, file_no: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="bed_no"
            className="block text-sm font-medium text-gray-700"
          >
            Yatak No
          </label>
          <input
            type="text"
            id="bed_no"
            value={formData.bed_no}
            onChange={(e) =>
              setFormData({ ...formData, bed_no: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700"
          >
            Ad *
          </label>
          <input
            type="text"
            id="first_name"
            required
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700"
          >
            Soyad *
          </label>
          <input
            type="text"
            id="last_name"
            required
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="birth_date"
            className="block text-sm font-medium text-gray-700"
          >
            Doğum Tarihi *
          </label>
          <input
            type="date"
            id="birth_date"
            required
            value={formData.birth_date}
            onChange={(e) =>
              setFormData({ ...formData, birth_date: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            Cinsiyet *
          </label>
          <select
            id="gender"
            required
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Kız">Kız</option>
            <option value="Erkek">Erkek</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="medical_diagnosis"
          className="block text-sm font-medium text-gray-700"
        >
          Tıbbi Tanı
        </label>
        <textarea
          id="medical_diagnosis"
          rows={3}
          value={formData.medical_diagnosis}
          onChange={(e) =>
            setFormData({ ...formData, medical_diagnosis: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
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
          {loading ? 'Kaydediliyor...' : patient ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
