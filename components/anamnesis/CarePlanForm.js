'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CarePlanForm({ patientId, formId, diagnosisId, diagnosis, carePlan, expectedOutcomes: initialOutcomes, interventions: initialInterventions }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Expected outcomes state
  const [expectedOutcomes, setExpectedOutcomes] = useState(initialOutcomes || []);
  
  // Interventions state
  const [interventions, setInterventions] = useState(initialInterventions || []);
  
  // Evaluation state (radio button)
  const [evaluation, setEvaluation] = useState(
    carePlan?.evaluation || null
  );

  const handleOutcomeToggle = (outcomeId) => {
    setExpectedOutcomes(prev =>
      prev.map(outcome =>
        outcome.id === outcomeId
          ? { ...outcome, selected: !outcome.selected }
          : outcome
      )
    );
  };

  const handleInterventionToggle = (interventionId) => {
    setInterventions(prev =>
      prev.map(intervention =>
        intervention.id === interventionId
          ? { ...intervention, selected: !intervention.selected }
          : intervention
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        `/api/patients/${patientId}/anamnesis/${formId}/diagnoses/${diagnosisId}/care-plan`,
        {
          method: carePlan ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expected_outcomes: expectedOutcomes.filter(o => o.selected).map(o => o.id),
            interventions: interventions.filter(i => i.selected).map(i => i.id),
            evaluation: evaluation,
          }),
        }
      );

      if (response.ok) {
        router.refresh();
        // Show success message
        alert('Bakım planı başarıyla kaydedildi');
      } else {
        const data = await response.json();
        alert(data.error || 'Bakım planı kaydedilemedi');
      }
    } catch (error) {
      console.error('Error saving care plan:', error);
      alert('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 space-y-8">
        {/* Beklenen Sonuç Kriterleri */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Beklenen Sonuç Kriterleri
          </h3>
          {expectedOutcomes.length > 0 ? (
            <div className="space-y-3">
              {expectedOutcomes.map((outcome) => (
                <label
                  key={outcome.id}
                  className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={outcome.selected || false}
                    onChange={() => handleOutcomeToggle(outcome.id)}
                    className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="flex-1 text-gray-800">
                    {outcome.outcome_text}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p>Henüz beklenen sonuç kriteri tanımlanmamış</p>
              <p className="text-sm mt-2">Yeni kriter eklemek için yönetim paneline gidin</p>
            </div>
          )}
        </div>

        {/* Girişimler */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Girişimler
          </h3>
          {interventions.length > 0 ? (
            <div className="space-y-3">
              {interventions.map((intervention) => (
                <label
                  key={intervention.id}
                  className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={intervention.selected || false}
                    onChange={() => handleInterventionToggle(intervention.id)}
                    className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="flex-1 text-gray-800">
                    {intervention.intervention_text}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p>Henüz girişim tanımlanmamış</p>
              <p className="text-sm mt-2">Yeni girişim eklemek için yönetim paneline gidin</p>
            </div>
          )}
        </div>

        {/* Değerlendirme */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Değerlendirme
          </h3>
          <div className="space-y-3">
            {['ulaşıldı', 'kısmen_ulaşıldı', 'ulaşılamadı'].map((value) => (
              <label
                key={value}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="evaluation"
                  value={value}
                  checked={evaluation === value}
                  onChange={(e) => setEvaluation(e.target.value)}
                  className="mr-3 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-800 capitalize">
                  {value.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </form>
  );
}

