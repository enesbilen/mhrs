'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertDialog from '@/components/common/AlertDialog';

// Calculate patient age
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Static questions for Step 1
const STATIC_QUESTIONS = [
  {
    id: 'developmental_neurological',
    text: 'Çocuğun sözel iletişimini etkileyebilecek gelişimsel ya da nörolojik durumların varlığı',
    type: 'yes_no',
    options: ['Yok', 'Var'],
  },
  {
    id: 'allergies',
    text: 'Bilinen alerjisi var mı?',
    type: 'yes_no',
    options: ['Hayır', 'Evet'],
  },
  {
    id: 'chronic_disease',
    text: 'Kronik/tanılanmış hastalığı var mı?',
    type: 'yes_no',
    options: ['Hayır', 'Evet'],
  },
  {
    id: 'surgery',
    text: 'Geçirilmiş ameliyatı var mı?',
    type: 'yes_no',
    options: ['Hayır', 'Evet'],
  },
  {
    id: 'home_medication',
    text: 'Evde kullandığı ilaçlar var mı?',
    type: 'yes_no',
    options: ['Hayır', 'Evet'],
  },
  {
    id: 'admission_from',
    text: 'Yoğun bakıma nereden geldi?',
    type: 'select',
    options: ['Servis', 'Acil servisten', 'Ameliyathane', 'Evden', 'Dış merkez'],
  },
  {
    id: 'brought_equipment',
    text: 'Hastanın yanında getirdiği malzeme/Cihazlar var mı?',
    type: 'yes_no',
    options: ['Hayır', 'Evet'],
  },
  {
    id: 'consciousness',
    text: 'Hastanın bilinci',
    type: 'select',
    options: ['Açık', 'Kapalı'],
  },
];

export default function AnamnesisFormWizard({
  patient,
  questions,
  categories,
  userId,
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [staticAnswers, setStaticAnswers] = useState({});
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unansweredDialog, setUnansweredDialog] = useState({ isOpen: false, questions: [] });

  const patientAge = calculateAge(patient.birth_date);

  // Filter questions based on criteria
  const getFilteredQuestions = () => {
    return questions.filter((q) => {
      // Check age criteria
      if (q.criteria.includes('age_under_4') && patientAge < 4) {
        return false;
      }

      // Check consciousness criteria
      if (
        q.criteria.includes('consciousness_closed') &&
        staticAnswers.consciousness === 'Kapalı'
      ) {
        return false;
      }

      // Check developmental/neurological criteria
      const devNeuroAnswer = typeof staticAnswers.developmental_neurological === 'object' 
        ? staticAnswers.developmental_neurological?.answer 
        : staticAnswers.developmental_neurological;
      if (
        q.criteria.includes('developmental_neurological') &&
        devNeuroAnswer === 'Var'
      ) {
        return false;
      }

      return true;
    });
  };

  const filteredQuestions = step === 2 ? getFilteredQuestions() : [];

  const handleStaticAnswer = (questionId, value) => {
    // For questions that need notes, store as object if "Evet"/"Var" is selected
    const needsNote = ['developmental_neurological', 'allergies', 'chronic_disease', 'surgery', 'brought_equipment'].includes(questionId);
    const isMedication = questionId === 'home_medication';
    
    if (isMedication) {
      // Special handling for medication
      if (value === 'Evet') {
        const currentAnswer = staticAnswers[questionId];
        // Keep existing medications if available, otherwise start with one empty medication
        const existingMeds = typeof currentAnswer === 'object' && currentAnswer?.medications && currentAnswer.medications.length > 0
          ? currentAnswer.medications
          : [{ name: '', dose: '', frequency: '', route: '' }];
        setStaticAnswers({ 
          ...staticAnswers, 
          [questionId]: { answer: value, medications: existingMeds }
        });
      } else {
        // Just store "Hayır" as string
        setStaticAnswers({ ...staticAnswers, [questionId]: value });
      }
    } else if (needsNote) {
      const positiveAnswer = questionId === 'developmental_neurological' ? 'Var' : 'Evet';
      if (value === positiveAnswer) {
        // Keep existing note if available
        const currentAnswer = staticAnswers[questionId];
        setStaticAnswers({ 
          ...staticAnswers, 
          [questionId]: typeof currentAnswer === 'object' && currentAnswer?.note 
            ? { answer: value, note: currentAnswer.note }
            : { answer: value, note: '' }
        });
      } else {
        // Just store the answer without note
        setStaticAnswers({ ...staticAnswers, [questionId]: value });
      }
    } else {
      setStaticAnswers({ ...staticAnswers, [questionId]: value });
    }
  };

  const handleStaticNote = (questionId, note) => {
    const currentAnswer = staticAnswers[questionId];
    if (typeof currentAnswer === 'object' && currentAnswer?.answer) {
      setStaticAnswers({ ...staticAnswers, [questionId]: { ...currentAnswer, note } });
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const medications = staticAnswers.home_medication?.medications || [];
    const updated = [...medications];
    if (!updated[index]) {
      updated[index] = { name: '', dose: '', frequency: '', route: '' };
    }
    updated[index][field] = value;
    setStaticAnswers({ 
      ...staticAnswers, 
      home_medication: { answer: 'Evet', medications: updated }
    });
  };

  const addMedication = () => {
    const medications = staticAnswers.home_medication?.medications || [];
    setStaticAnswers({ 
      ...staticAnswers, 
      home_medication: { 
        answer: 'Evet', 
        medications: [...medications, { name: '', dose: '', frequency: '', route: '' }]
      }
    });
  };

  const removeMedication = (index) => {
    const medications = staticAnswers.home_medication?.medications || [];
    const updated = medications.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setStaticAnswers({ ...staticAnswers, home_medication: 'Hayır' });
    } else {
      setStaticAnswers({ 
        ...staticAnswers, 
        home_medication: { answer: 'Evet', medications: updated }
      });
    }
  };

  const handleDynamicAnswer = (questionId, value) => {
    setDynamicAnswers({ ...dynamicAnswers, [questionId]: value });
  };

  const handleNext = () => {
    // Validate Step 1
    const missingFields = [];
    
    STATIC_QUESTIONS.forEach((q) => {
      const answer = staticAnswers[q.id];
      
      // Basic check: answer must exist
      if (answer === undefined || answer === null || answer === '') {
        missingFields.push(q.text);
        return;
      }
      
      // For questions with notes, check if note is provided when needed
      const needsNote = ['developmental_neurological', 'allergies', 'chronic_disease', 'surgery', 'brought_equipment'].includes(q.id);
      if (needsNote) {
        const positiveAnswer = q.id === 'developmental_neurological' ? 'Var' : 'Evet';
        
        // If answer is string (Hayır/Yok selected), it's valid
        if (typeof answer === 'string') {
          if (answer === '') {
            missingFields.push(q.text);
          }
          return;
        }
        
        // If answer is object (Evet/Var selected), check if note is provided
        if (typeof answer === 'object' && answer.answer === positiveAnswer) {
          if (!answer.note || answer.note.trim() === '') {
            missingFields.push(`${q.text} - Açıklama gerekli`);
            return;
          }
        }
      }
      
      // For home_medication, check if medications are provided when "Evet" is selected
      if (q.id === 'home_medication') {
        // If answer is string "Hayır", it's valid
        if (typeof answer === 'string') {
          if (answer === 'Hayır') {
            return; // Valid
          }
          if (answer === '') {
            missingFields.push(q.text);
            return;
          }
        }
        
        // If answer is object with "Evet", check medications
        if (typeof answer === 'object' && answer.answer === 'Evet') {
          if (!answer.medications || answer.medications.length === 0) {
            missingFields.push(`${q.text} - En az bir ilaç eklenmelidir`);
            return;
          }
          // Check if all medications have required fields
          const invalidMeds = answer.medications.filter(med => 
            !med.name || med.name.trim() === '' || 
            !med.dose || med.dose.trim() === '' || 
            !med.frequency || med.frequency.trim() === '' || 
            !med.route || med.route.trim() === ''
          );
          if (invalidMeds.length > 0) {
            missingFields.push(`${q.text} - Tüm ilaç bilgileri doldurulmalıdır`);
            return;
          }
        }
      }
    });

    if (missingFields.length > 0) {
      setError(`Lütfen aşağıdaki alanları doldurun:\n${missingFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}`);
      return;
    }

    setError('');
    setStep(2);
  };

  const checkUnansweredRequiredQuestions = () => {
    const unanswered = [];
    
    // Check filtered questions for required unanswered ones
    filteredQuestions.forEach((question) => {
      if (question.is_required) {
        const answer = dynamicAnswers[question.id];
        let isAnswered = false;

        if (answer === undefined || answer === null || answer === '') {
          isAnswered = false;
        } else if (typeof answer === 'string') {
          isAnswered = answer.trim() !== '';
        } else if (Array.isArray(answer)) {
          isAnswered = answer.length > 0;
        } else if (typeof answer === 'object') {
          // For yes_no_with_note
          if (answer.answer) {
            isAnswered = true;
          } else {
            isAnswered = false;
          }
        }

        if (!isAnswered) {
          unanswered.push({
            id: question.id,
            text: question.question_text,
            category: categories.find((c) => c.id == question.category_id)?.name || 'Kategori Yok',
          });
        }
      }
    });

    return unanswered;
  };

  const handleSubmit = async () => {
    // Check for unanswered required questions
    const unansweredRequired = checkUnansweredRequiredQuestions();
    
    if (unansweredRequired.length > 0) {
      setUnansweredDialog({ isOpen: true, questions: unansweredRequired });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save form
      const response = await fetch(`/api/patients/${patient.id}/anamnesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          static_answers: staticAnswers,
          dynamic_answers: dynamicAnswers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to view page
        router.push(`/patients/${patient.id}/anamnesis/${data.formId}`);
        router.refresh();
      } else {
        setError(data.error || 'Form kaydedilemedi');
      }
    } catch (error) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question) => {
    const answer = dynamicAnswers[question.id] || '';

    switch (question.question_type) {
      case 'yes_no':
        return (
          <div key={question.id} className="space-y-2">
            {['Evet', 'Hayır'].map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  checked={answer === opt}
                  onChange={() => handleDynamicAnswer(question.id, opt)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no_with_note':
        return (
          <div key={question.id} className="space-y-2">
            {['Evet', 'Hayır'].map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  checked={answer?.answer === opt}
                  onChange={() =>
                    handleDynamicAnswer(question.id, { answer: opt, note: answer?.note || '' })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
            {answer?.answer === 'Evet' && (
              <textarea
                placeholder="Açıklama..."
                value={answer?.note || ''}
                onChange={(e) =>
                  handleDynamicAnswer(question.id, { ...answer, note: e.target.value })
                }
                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            )}
          </div>
        );

      case 'text_input':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleDynamicAnswer(question.id, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  checked={answer === opt}
                  onChange={() => handleDynamicAnswer(question.id, opt)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        const multiAnswers = Array.isArray(answer) ? answer : [];
        return (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="checkbox"
                  checked={multiAnswers.includes(opt)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleDynamicAnswer(question.id, [...multiAnswers, opt]);
                    } else {
                      handleDynamicAnswer(
                        question.id,
                        multiAnswers.filter((a) => a !== opt)
                      );
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return <p className="text-gray-500">Desteklenmeyen soru tipi</p>;
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium">Genel Değerlendirme</span>
            </div>
            <div className="mx-4 h-0.5 w-16 bg-gray-300"></div>
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium">Detaylı Anamnez</span>
            </div>
          </div>
        </div>

        {/* Step 1: Static Questions */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Genel Değerlendirme</h3>

            {STATIC_QUESTIONS.map((q) => {
              const needsNote = ['developmental_neurological', 'allergies', 'chronic_disease', 'surgery', 'brought_equipment'].includes(q.id);
              const isMedication = q.id === 'home_medication';
              const currentAnswer = staticAnswers[q.id];
              const positiveAnswer = q.id === 'developmental_neurological' ? 'Var' : 'Evet';
              const showNote = needsNote && typeof currentAnswer === 'object' && currentAnswer?.answer === positiveAnswer;
              const showMedication = isMedication && typeof currentAnswer === 'object' && currentAnswer?.answer === 'Evet';

              return (
                <div key={q.id} className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {q.text} *
                  </label>
                  {q.type === 'yes_no' ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center">
                          <input
                            type="radio"
                            name={q.id}
                            checked={
                              typeof currentAnswer === 'object' 
                                ? currentAnswer?.answer === opt 
                                : currentAnswer === opt
                            }
                            onChange={() => handleStaticAnswer(q.id, opt)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                      {showNote && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Açıklama *
                          </label>
                          <textarea
                            value={currentAnswer?.note || ''}
                            onChange={(e) => handleStaticNote(q.id, e.target.value)}
                            placeholder="Lütfen açıklama giriniz..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                          />
                        </div>
                      )}
                      {showMedication && (
                        <div className="mt-4 space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            İlaç Bilgileri *
                          </label>
                          {(currentAnswer?.medications || []).map((med, index) => (
                            <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-700">İlaç {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeMedication(index)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Kaldır
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    İlaç Adı *
                                  </label>
                                  <input
                                    type="text"
                                    value={med.name || ''}
                                    onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                    placeholder="İlaç adı"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Doz *
                                  </label>
                                  <input
                                    type="text"
                                    value={med.dose || ''}
                                    onChange={(e) => handleMedicationChange(index, 'dose', e.target.value)}
                                    placeholder="Örn: 5mg"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Kullanma Sıklığı *
                                  </label>
                                  <input
                                    type="text"
                                    value={med.frequency || ''}
                                    onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                    placeholder="Örn: Günde 2 kez"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Kullanım Yolu *
                                  </label>
                                  <input
                                    type="text"
                                    value={med.route || ''}
                                    onChange={(e) => handleMedicationChange(index, 'route', e.target.value)}
                                    placeholder="Örn: Oral, İV, İM"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addMedication}
                            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                          >
                            + İlaç Ekle
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      value={typeof currentAnswer === 'object' ? currentAnswer?.answer || '' : currentAnswer || ''}
                      onChange={(e) => handleStaticAnswer(q.id, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seçiniz...</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Devam Et
            </button>
          </div>
        )}

        {/* Step 2: Dynamic Questions */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Detaylı Anamnez</h3>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Geri Dön
              </button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Filtrelenen sorular:</strong> Hastanın yaşı ({patientAge} yaş) ve
                genel değerlendirme cevaplarına göre bazı sorular gösterilmemektedir.
              </p>
            </div>

            {categories.map((category) => {
              const categoryQuestions = filteredQuestions.filter(
                (q) => q.category_id == category.id
              );

              if (categoryQuestions.length === 0) return null;

              return (
                <div key={category.id} className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    {category.name}
                  </h4>

                  <div className="space-y-4">
                    {categoryQuestions.map((q) => (
                      <div key={q.id} className="pl-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {q.question_text}
                          {q.is_required && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        {renderQuestion(q)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Formu Kaydet ve Tanıları Hesapla'}
            </button>
          </div>
        )}
      </div>

      {/* Unanswered Required Questions Dialog */}
      <AlertDialog
        isOpen={unansweredDialog.isOpen}
        onClose={() => setUnansweredDialog({ ...unansweredDialog, isOpen: false })}
        title="⚠️ Cevaplanmamış Zorunlu Sorular"
        message={`Formu kaydetmeden önce aşağıdaki ${unansweredDialog.questions.length} adet zorunlu soruyu cevaplamanız gerekmektedir:\n\n${unansweredDialog.questions.map((q, idx) => `${idx + 1}. [${q.category}] ${q.text}`).join('\n')}\n\nLütfen bu soruları cevaplayarak formu tamamlayın.`}
        variant="warning"
        buttonText="Tamam"
      />
    </div>
  );
}
