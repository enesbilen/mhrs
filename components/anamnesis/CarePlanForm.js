'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CarePlanForm({ patientId, formId, diagnosisId, diagnosis, carePlan, expectedOutcomes: initialOutcomes, interventions: initialInterventions, evaluationOptions: initialEvaluationOptions }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(!!carePlan);
  
  // Expected outcomes state
  const [expectedOutcomes, setExpectedOutcomes] = useState(initialOutcomes || []);
  
  // Interventions state
  const [interventions, setInterventions] = useState(initialInterventions || []);
  
  // Evaluation options state
  const [evaluationOptions] = useState(initialEvaluationOptions || []);
  
  // Evaluation state (radio button)
  const [evaluation, setEvaluation] = useState(
    carePlan?.evaluation || null
  );

  // Sync state when props change
  useEffect(() => {
    setExpectedOutcomes(initialOutcomes || []);
    setInterventions(initialInterventions || []);
    setEvaluation(carePlan?.evaluation || null);
    setShowResults(!!carePlan);
  }, [initialOutcomes, initialInterventions, carePlan]);

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
        setShowResults(true);
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
          {evaluationOptions.length > 0 ? (
            <div className="space-y-3">
              {evaluationOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="evaluation"
                    value={option.option_value}
                    checked={evaluation === option.option_value}
                    onChange={(e) => setEvaluation(e.target.value)}
                    className="mr-3 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-800">
                    {option.option_text}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p>Henüz değerlendirme seçeneği tanımlanmamış</p>
              <p className="text-sm mt-2">Yeni seçenek eklemek için yönetim paneline gidin</p>
            </div>
          )}
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

// Bakım Planı Sonuçları Bileşeni
export function CarePlanResults({ carePlan, expectedOutcomes, interventions, evaluation, evaluationOptions }) {
  const selectedOutcomes = expectedOutcomes.filter(o => o.selected);
  const unselectedOutcomes = expectedOutcomes.filter(o => !o.selected);
  const selectedInterventions = interventions.filter(i => i.selected);
  const unselectedInterventions = interventions.filter(i => !i.selected);

  if (!carePlan) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Bakım Planı Sonuçları</h3>

        {/* Seçilen Beklenen Sonuç Kriterleri */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Seçilen Beklenen Sonuç Kriterleri ({selectedOutcomes.length})
          </h4>
          {selectedOutcomes.length > 0 ? (
            <div className="space-y-2">
              {selectedOutcomes.map((outcome, index) => (
                <div
                  key={outcome.id}
                  className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-green-600 text-white text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-800">{outcome.outcome_text}</span>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
                    Seçildi
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Henüz beklenen sonuç kriteri seçilmemiş</p>
          )}
        </div>

        {/* Seçilmeyen Beklenen Sonuç Kriterleri */}
        {unselectedOutcomes.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-3">
              Seçilmeyen Beklenen Sonuç Kriterleri ({unselectedOutcomes.length})
            </h4>
            <div className="space-y-2">
              {unselectedOutcomes.map((outcome, index) => (
                <div
                  key={outcome.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-600">{outcome.outcome_text}</span>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded">
                    Seçilmedi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seçilen Girişimler */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Seçilen Girişimler ({selectedInterventions.length})
          </h4>
          {selectedInterventions.length > 0 ? (
            <div className="space-y-2">
              {selectedInterventions.map((intervention, index) => (
                <div
                  key={intervention.id}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-800">{intervention.intervention_text}</span>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded">
                    Seçildi
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Henüz girişim seçilmemiş</p>
          )}
        </div>

        {/* Seçilmeyen Girişimler */}
        {unselectedInterventions.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-3">
              Seçilmeyen Girişimler ({unselectedInterventions.length})
            </h4>
            <div className="space-y-2">
              {unselectedInterventions.map((intervention, index) => (
                <div
                  key={intervention.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-600">{intervention.intervention_text}</span>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded">
                    Seçilmedi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Değerlendirme */}
        {evaluation && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-3">Değerlendirme</h4>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-purple-800 font-medium">
                {evaluationOptions.find(opt => opt.option_value === evaluation)?.option_text || evaluation.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

