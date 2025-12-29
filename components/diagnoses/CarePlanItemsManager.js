'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function CarePlanItemsManager({ diagnosisId, expectedOutcomes: initialOutcomes, interventions: initialInterventions, evaluationOptions: initialEvaluationOptions }) {
  const router = useRouter();
  const [expectedOutcomes, setExpectedOutcomes] = useState(initialOutcomes);
  const [interventions, setInterventions] = useState(initialInterventions);
  const [evaluationOptions, setEvaluationOptions] = useState(initialEvaluationOptions || []);

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setExpectedOutcomes(initialOutcomes);
    setInterventions(initialInterventions);
    setEvaluationOptions(initialEvaluationOptions || []);
  }, [initialOutcomes, initialInterventions, initialEvaluationOptions]);
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [editingEvaluationOption, setEditingEvaluationOption] = useState(null);
  const [newOutcomeText, setNewOutcomeText] = useState('');
  const [newInterventionText, setNewInterventionText] = useState('');
  const [newEvaluationOptionText, setNewEvaluationOptionText] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Convert Turkish text to URL-friendly value
  const textToValue = (text) => {
    if (!text) return '';
    
    const turkishChars = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    return text
      .split('')
      .map(char => turkishChars[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, id: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

  // Expected Outcomes Functions
  const handleAddOutcome = async () => {
    if (!newOutcomeText.trim()) return;

    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/expected-outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome_text: newOutcomeText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        // Optimistically update state
        const maxOrder = expectedOutcomes.length > 0
          ? Math.max(...expectedOutcomes.map(o => o.order_index || 0))
          : 0;
        const newOutcome = {
          id: data.id,
          outcome_text: newOutcomeText.trim(),
          order_index: maxOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setExpectedOutcomes([...expectedOutcomes, newOutcome]);
        setNewOutcomeText('');
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Beklenen sonuç kriteri eklendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Beklenen sonuç kriteri eklenemedi',
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

  const handleUpdateOutcome = async (id, text) => {
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/expected-outcomes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome_text: text.trim() }),
      });

      if (response.ok) {
        // Optimistically update state
        setExpectedOutcomes(prev =>
          prev.map(outcome =>
            outcome.id === id
              ? { ...outcome, outcome_text: text.trim(), updated_at: new Date().toISOString() }
              : outcome
          )
        );
        setEditingOutcome(null);
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Beklenen sonuç kriteri güncellendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Güncelleme başarısız',
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

  const handleDeleteOutcome = async (id) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/expected-outcomes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically update state
        setExpectedOutcomes(prev => prev.filter(outcome => outcome.id !== id));
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Beklenen sonuç kriteri silindi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Silme başarısız',
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

  // Interventions Functions
  const handleAddIntervention = async () => {
    if (!newInterventionText.trim()) return;

    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_text: newInterventionText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        // Optimistically update state
        const maxOrder = interventions.length > 0
          ? Math.max(...interventions.map(i => i.order_index || 0))
          : 0;
        const newIntervention = {
          id: data.id,
          intervention_text: newInterventionText.trim(),
          order_index: maxOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setInterventions([...interventions, newIntervention]);
        setNewInterventionText('');
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Girişim eklendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Girişim eklenemedi',
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

  const handleUpdateIntervention = async (id, text) => {
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/interventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_text: text.trim() }),
      });

      if (response.ok) {
        // Optimistically update state
        setInterventions(prev =>
          prev.map(intervention =>
            intervention.id === id
              ? { ...intervention, intervention_text: text.trim(), updated_at: new Date().toISOString() }
              : intervention
          )
        );
        setEditingIntervention(null);
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Girişim güncellendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Güncelleme başarısız',
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

  const handleDeleteIntervention = async (id) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/interventions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically update state
        setInterventions(prev => prev.filter(intervention => intervention.id !== id));
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Girişim silindi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Silme başarısız',
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

  const handleDeleteClick = (type, id) => {
    setConfirmDialog({ isOpen: true, type, id });
  };

  // Evaluation Options Functions
  const handleAddEvaluationOption = async () => {
    if (!newEvaluationOptionText.trim()) return;

    const optionValue = textToValue(newEvaluationOptionText);

    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/evaluation-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          option_text: newEvaluationOptionText.trim(),
          option_value: optionValue
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Optimistically update state
        const maxOrder = evaluationOptions.length > 0
          ? Math.max(...evaluationOptions.map(o => o.order_index || 0))
          : 0;
        const newOption = {
          id: data.id,
          option_text: newEvaluationOptionText.trim(),
          option_value: optionValue,
          order_index: maxOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEvaluationOptions([...evaluationOptions, newOption]);
        setNewEvaluationOptionText('');
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Değerlendirme seçeneği eklendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Değerlendirme seçeneği eklenemedi',
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

  const handleUpdateEvaluationOption = async (id, text, value) => {
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/evaluation-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          option_text: text.trim(),
          option_value: value.trim()
        }),
      });

      if (response.ok) {
        // Optimistically update state
        setEvaluationOptions(prev =>
          prev.map(option =>
            option.id === id
              ? { ...option, option_text: text.trim(), option_value: value.trim(), updated_at: new Date().toISOString() }
              : option
          )
        );
        setEditingEvaluationOption(null);
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Değerlendirme seçeneği güncellendi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Güncelleme başarısız',
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

  const handleDeleteEvaluationOption = async (id) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}/care-plan-items/evaluation-options/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically update state
        setEvaluationOptions(prev => prev.filter(option => option.id !== id));
        router.refresh();
        setAlertDialog({
          isOpen: true,
          message: 'Değerlendirme seçeneği silindi',
          variant: 'success',
        });
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Silme başarısız',
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

  const handleDeleteConfirm = async () => {
    const { type, id } = confirmDialog;
    setConfirmDialog({ isOpen: false, type: null, id: null });

    if (type === 'outcome') {
      await handleDeleteOutcome(id);
    } else if (type === 'intervention') {
      await handleDeleteIntervention(id);
    } else if (type === 'evaluation') {
      await handleDeleteEvaluationOption(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Beklenen Sonuç Kriterleri */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Beklenen Sonuç Kriterleri</h3>
          <p className="text-sm text-gray-500 mt-1">
            Bu tanı için beklenen sonuç kriterlerini ekleyin, düzenleyin veya silin
          </p>
        </div>
        <div className="p-6">
          {/* Add New Outcome */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newOutcomeText}
                onChange={(e) => setNewOutcomeText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOutcome()}
                placeholder="Yeni beklenen sonuç kriteri ekleyin..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddOutcome}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Outcomes List */}
          <div className="space-y-3">
            {expectedOutcomes.length > 0 ? (
              expectedOutcomes.map((outcome, index) => (
                <div
                  key={outcome.id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    {outcome.order_index || index + 1}
                  </span>
                  {editingOutcome === outcome.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        defaultValue={outcome.outcome_text}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== outcome.outcome_text) {
                            handleUpdateOutcome(outcome.id, e.target.value);
                          } else {
                            setEditingOutcome(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateOutcome(outcome.id, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingOutcome(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p
                      className="flex-1 text-gray-800 cursor-pointer"
                      onClick={() => setEditingOutcome(outcome.id)}
                    >
                      {outcome.outcome_text}
                    </p>
                  )}
                  <button
                    onClick={() => handleDeleteClick('outcome', outcome.id)}
                    disabled={deleting === outcome.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Sil"
                  >
                    {deleting === outcome.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                <p>Henüz beklenen sonuç kriteri eklenmemiş</p>
                <p className="text-sm mt-2">Yukarıdaki alana yazarak ekleyebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Girişimler */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Girişimler</h3>
          <p className="text-sm text-gray-500 mt-1">
            Bu tanı için girişimleri ekleyin, düzenleyin veya silin
          </p>
        </div>
        <div className="p-6">
          {/* Add New Intervention */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newInterventionText}
                onChange={(e) => setNewInterventionText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIntervention()}
                placeholder="Yeni girişim ekleyin..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddIntervention}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Interventions List */}
          <div className="space-y-3">
            {interventions.length > 0 ? (
              interventions.map((intervention, index) => (
                <div
                  key={intervention.id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    {intervention.order_index || index + 1}
                  </span>
                  {editingIntervention === intervention.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        defaultValue={intervention.intervention_text}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== intervention.intervention_text) {
                            handleUpdateIntervention(intervention.id, e.target.value);
                          } else {
                            setEditingIntervention(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateIntervention(intervention.id, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingIntervention(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p
                      className="flex-1 text-gray-800 cursor-pointer"
                      onClick={() => setEditingIntervention(intervention.id)}
                    >
                      {intervention.intervention_text}
                    </p>
                  )}
                  <button
                    onClick={() => handleDeleteClick('intervention', intervention.id)}
                    disabled={deleting === intervention.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Sil"
                  >
                    {deleting === intervention.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                <p>Henüz girişim eklenmemiş</p>
                <p className="text-sm mt-2">Yukarıdaki alana yazarak ekleyebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Değerlendirme Seçenekleri */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Değerlendirme Seçenekleri</h3>
          <p className="text-sm text-gray-500 mt-1">
            Bu tanı için değerlendirme seçeneklerini ekleyin, düzenleyin veya silin
          </p>
        </div>
        <div className="p-6">
          {/* Add New Evaluation Option */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newEvaluationOptionText}
                onChange={(e) => setNewEvaluationOptionText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEvaluationOption()}
                placeholder="Seçenek metni (örn: Kısmen Ulaşıldı)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddEvaluationOption}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
            {newEvaluationOptionText && (
              <p className="text-xs text-gray-500 mt-2">
                Otomatik değer: <span className="font-mono">{textToValue(newEvaluationOptionText)}</span>
              </p>
            )}
          </div>

          {/* Evaluation Options List */}
          <div className="space-y-3">
            {evaluationOptions.length > 0 ? (
              evaluationOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                    {option.order_index || index + 1}
                  </span>
                  {editingEvaluationOption === option.id ? (
                    <div className="flex-1">
                      <input
                        type="text"
                        defaultValue={option.option_text}
                        onBlur={(e) => {
                          const newValue = textToValue(e.target.value);
                          if (e.target.value.trim() !== option.option_text || newValue !== option.option_value) {
                            handleUpdateEvaluationOption(option.id, e.target.value, newValue);
                          } else {
                            setEditingEvaluationOption(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newValue = textToValue(e.target.value);
                            handleUpdateEvaluationOption(option.id, e.target.value, newValue);
                          } else if (e.key === 'Escape') {
                            setEditingEvaluationOption(null);
                          }
                        }}
                        autoFocus
                        placeholder="Seçenek metni"
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p
                        className="text-gray-800 cursor-pointer"
                        onClick={() => setEditingEvaluationOption(option.id)}
                      >
                        <span className="font-medium">{option.option_text}</span>
                        <span className="text-gray-500 text-sm ml-2">({option.option_value})</span>
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteClick('evaluation', option.id)}
                    disabled={deleting === option.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Sil"
                  >
                    {deleting === option.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                <p>Henüz değerlendirme seçeneği eklenmemiş</p>
                <p className="text-sm mt-2">Yukarıdaki alanlara yazarak ekleyebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, id: null })}
        onConfirm={handleDeleteConfirm}
        title={
          confirmDialog.type === 'outcome' ? 'Beklenen Sonuç Kriterini Sil' :
          confirmDialog.type === 'intervention' ? 'Girişimi Sil' :
          'Değerlendirme Seçeneğini Sil'
        }
        message={
          confirmDialog.type === 'outcome' 
            ? 'Bu beklenen sonuç kriterini silmek istediğinizden emin misiniz?'
            : confirmDialog.type === 'intervention'
            ? 'Bu girişimi silmek istediğinizden emin misiniz?'
            : 'Bu değerlendirme seçeneğini silmek istediğinizden emin misiniz?'
        }
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

