'use client';

import { useState, useMemo } from 'react';
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

export default function AnamnesisFormWizard({
  patient,
  questions,
  categories,
  steps = [],
  userId,
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1); // This is now the index in activeSteps array (1-based)
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unansweredDialog, setUnansweredDialog] = useState({ isOpen: false, questions: [] });

  const patientAge = calculateAge(patient.birth_date);

  // Group categories by step_id
  const categoriesByStep = categories.reduce((acc, cat) => {
    const stepId = cat.step_id || cat.step || 1;
    if (!acc[stepId]) {
      acc[stepId] = [];
    }
    acc[stepId].push(cat);
    return acc;
  }, {});

  // Get steps sorted by order_index, filter only steps that have categories
  const activeSteps = steps
    .filter(step => categoriesByStep[step.id] && categoriesByStep[step.id].length > 0)
    .sort((a, b) => a.order_index - b.order_index);
  
  // Create a map for quick step lookup
  const stepMap = steps.reduce((acc, step) => {
    acc[step.id] = step;
    return acc;
  }, {});

  // Get questions for a specific step (by step_id)
  const getQuestionsForStep = (stepId) => {
    const stepCategories = categoriesByStep[stepId] || [];
    const categoryIds = stepCategories.map(cat => cat.id);
    return questions.filter(q => categoryIds.includes(q.category_id));
  };

  // Filter questions based on criteria and dynamic conditions
  const getFilteredQuestions = (questionsToFilter) => {
    return questionsToFilter.filter((q) => {
      // Static criteria check
      if (q.criteria && q.criteria.length > 0) {
        // Check age criteria
        if (q.criteria.includes('age_under_4') && patientAge < 4) {
          return false;
        }

        // Check consciousness criteria - find consciousness answer from step 1
        const consciousnessQuestion = questions.find(
          q => q.question_text === 'Hastanın bilinci' ||
               q.question_text?.includes('bilinci')
        );
        if (consciousnessQuestion) {
          const consciousnessAnswer = answers[consciousnessQuestion.id];
          if (
            q.criteria.includes('consciousness_closed') &&
            consciousnessAnswer === 'Kapalı'
          ) {
            return false;
          }
        }

        // Check developmental/neurological criteria
        const devNeuroQuestion = questions.find(
          q => q.question_text?.includes('gelişimsel') ||
               q.question_text?.includes('nörolojik')
        );
        if (devNeuroQuestion) {
          const devNeuroAnswer = typeof answers[devNeuroQuestion.id] === 'object'
            ? answers[devNeuroQuestion.id]?.answer
            : answers[devNeuroQuestion.id];
          if (
            q.criteria.includes('developmental_neurological') &&
            devNeuroAnswer === 'Var'
          ) {
            return false;
          }
        }
      }

      // Dynamic conditions check
      if (q.conditions && q.conditions.length > 0) {
        for (const condition of q.conditions) {
          const dependsOnAnswer = answers[condition.depends_on_question_id];

          // Get the actual answer value (handle both simple and object answers)
          let answerValue = typeof dependsOnAnswer === 'object'
            ? dependsOnAnswer?.answer
            : dependsOnAnswer;

          // Parse condition values (stored as JSON array)
          const conditionValues = typeof condition.condition_value === 'string'
            ? JSON.parse(condition.condition_value)
            : (Array.isArray(condition.condition_value) ? condition.condition_value : []);

          // For multiple choice answers, handle array of answers
          const answerValues = Array.isArray(answerValue) ? answerValue : [answerValue];

          // Check if any answer value matches any condition value
          const hasMatch = answerValues.some(av =>
            conditionValues.some(cv => av === cv)
          );

          // Apply action based on condition
          if (condition.action === 'hide') {
            // Hide if match found
            if (hasMatch) {
              return false;
            }
          } else if (condition.action === 'show') {
            // Show only if match found, hide otherwise
            if (!hasMatch) {
              return false;
            }
          }
        }
      }

      return true;
    });
  };

  const handleAnswer = (questionId, value, questionType) => {
    // For yes_no_with_note questions
    if (questionType === 'yes_no_with_note') {
      const currentAnswer = answers[questionId];
      if (value === 'Evet') {
        setAnswers({ 
          ...answers, 
          [questionId]: typeof currentAnswer === 'object' && currentAnswer?.note 
            ? { answer: value, note: currentAnswer.note }
            : { answer: value, note: '' }
        });
      } else {
        setAnswers({ ...answers, [questionId]: { answer: value, note: '' } });
      }
    } else if (questionType === 'medication_list') {
      // Medication list is handled in renderQuestion
      setAnswers({ ...answers, [questionId]: value });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleNote = (questionId, note) => {
    const currentAnswer = answers[questionId];
    if (typeof currentAnswer === 'object' && currentAnswer?.answer) {
      setAnswers({ ...answers, [questionId]: { ...currentAnswer, note } });
    }
  };

  const handleMedicationChange = (questionId, index, field, value) => {
    const currentAnswer = answers[questionId];
    const medications = currentAnswer?.medications || [];
    const updated = [...medications];
    if (!updated[index]) {
      updated[index] = { name: '', dose: '', frequency: '', route: '' };
    }
    updated[index][field] = value;
    setAnswers({ 
      ...answers, 
      [questionId]: { answer: 'Evet', medications: updated }
    });
  };

  const addMedication = (questionId) => {
    const currentAnswer = answers[questionId];
    const medications = currentAnswer?.medications || [];
    setAnswers({ 
      ...answers, 
      [questionId]: { 
        answer: 'Evet', 
        medications: [...medications, { name: '', dose: '', frequency: '', route: '' }]
      }
    });
  };

  const removeMedication = (questionId, index) => {
    const currentAnswer = answers[questionId];
    const medications = currentAnswer?.medications || [];
    const updated = medications.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setAnswers({ ...answers, [questionId]: 'Hayır' });
    } else {
      setAnswers({ 
        ...answers, 
        [questionId]: { answer: 'Evet', medications: updated }
      });
    }
  };

  const validateStep = (stepNum) => {
    const stepQuestions = getFilteredQuestions(getQuestionsForStep(stepNum));
    const missingFields = [];
    
    stepQuestions.forEach((q) => {
      if (!q.is_required) return;
      
      const answer = answers[q.id];
      
      // Basic check: answer must exist
      if (answer === undefined || answer === null || answer === '') {
        missingFields.push(q.question_text);
        return;
      }
      
      // For yes_no_with_note questions
      if (q.question_type === 'yes_no_with_note') {
        if (typeof answer === 'object' && answer.answer === 'Evet') {
          if (!answer.note || answer.note.trim() === '') {
            missingFields.push(`${q.question_text} - Açıklama gerekli`);
            return;
          }
        }
      }
      
      // For medication_list questions
      if (q.question_type === 'medication_list') {
        if (typeof answer === 'object' && answer.answer === 'Evet') {
          if (!answer.medications || answer.medications.length === 0) {
            missingFields.push(`${q.question_text} - En az bir ilaç eklenmelidir`);
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
            missingFields.push(`${q.question_text} - Tüm ilaç bilgileri doldurulmalıdır`);
            return;
          }
        }
      }
      
      // For text_input
      if (q.question_type === 'text_input' && typeof answer === 'string') {
        if (answer.trim() === '') {
          missingFields.push(q.question_text);
          return;
        }
      }

      // For number_input
      if (q.question_type === 'number_input') {
        if (answer === '' || answer === null || answer === undefined) {
          missingFields.push(q.question_text);
          return;
        }
      }

      // For single_choice and multiple_choice
      if ((q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && !answer) {
        missingFields.push(q.question_text);
        return;
      }
    });

    return missingFields;
  };

  const handleNext = () => {
    const currentStepData = activeSteps[currentStep - 1];
    if (!currentStepData) return;
    
    const missingFields = validateStep(currentStepData.id);
    
    if (missingFields.length > 0) {
      setError(`Lütfen aşağıdaki alanları doldurun:\n${missingFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}`);
      return;
    }

    setError('');
    if (currentStep < activeSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const checkUnansweredRequiredQuestions = () => {
    const unanswered = [];
    
    // Check all steps except current step
    activeSteps.forEach((step, index) => {
      if (index + 1 === currentStep) return;
      
      const stepQuestions = getFilteredQuestions(getQuestionsForStep(step.id));
      stepQuestions.forEach((question) => {
        if (question.is_required) {
          const answer = answers[question.id];
          let isAnswered = false;

          if (answer === undefined || answer === null || answer === '') {
            isAnswered = false;
          } else if (typeof answer === 'string') {
            isAnswered = answer.trim() !== '';
          } else if (Array.isArray(answer)) {
            isAnswered = answer.length > 0;
          } else if (typeof answer === 'object') {
            // For yes_no_with_note or medication_list
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
          answers: answers,
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
    const answer = answers[question.id] || '';

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
                  onChange={() => handleAnswer(question.id, opt, question.question_type)}
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
                    handleAnswer(question.id, opt, question.question_type)
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
                  handleNote(question.id, e.target.value)
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
            onChange={(e) => handleAnswer(question.id, e.target.value, question.question_type)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'number_input':
        return (
          <input
            type="number"
            step="0.01"
            value={answer}
            onChange={(e) => handleAnswer(question.id, e.target.value, question.question_type)}
            placeholder="Sayısal değer giriniz..."
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
                  onChange={() => handleAnswer(question.id, opt, question.question_type)}
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
                      handleAnswer(question.id, [...multiAnswers, opt], question.question_type);
                    } else {
                      handleAnswer(
                        question.id,
                        multiAnswers.filter((a) => a !== opt),
                        question.question_type
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

      case 'medication_list':
        const currentAnswer = answer || '';
        const showMedication = typeof currentAnswer === 'object' && currentAnswer?.answer === 'Evet';
        return (
          <div key={question.id} className="space-y-2">
            {['Evet', 'Hayır'].map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  checked={
                    typeof currentAnswer === 'object' 
                      ? currentAnswer?.answer === opt 
                      : currentAnswer === opt
                  }
                  onChange={() => {
                    if (opt === 'Evet') {
                      const existingMeds = typeof currentAnswer === 'object' && currentAnswer?.medications && currentAnswer.medications.length > 0
                        ? currentAnswer.medications
                        : [{ name: '', dose: '', frequency: '', route: '' }];
                      handleAnswer(question.id, { answer: opt, medications: existingMeds }, question.question_type);
                    } else {
                      handleAnswer(question.id, opt, question.question_type);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
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
                        onClick={() => removeMedication(question.id, index)}
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
                          onChange={(e) => handleMedicationChange(question.id, index, 'name', e.target.value)}
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
                          onChange={(e) => handleMedicationChange(question.id, index, 'dose', e.target.value)}
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
                          onChange={(e) => handleMedicationChange(question.id, index, 'frequency', e.target.value)}
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
                          onChange={(e) => handleMedicationChange(question.id, index, 'route', e.target.value)}
                          placeholder="Örn: Oral, İV, İM"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMedication(question.id)}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  + İlaç Ekle
                </button>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500">Desteklenmeyen soru tipi</p>;
    }
  };

  // Get current step info - memoized to update when answers or currentStep changes
  const currentStepInfo = useMemo(() => {
    const step = activeSteps[currentStep - 1];
    if (!step) return null;

    const stepCategories = categoriesByStep[step.id] || [];
    const stepName = step.name || `Step ${currentStep}`;
    const stepQuestions = getFilteredQuestions(getQuestionsForStep(step.id));
    const isLastStep = currentStep === activeSteps.length;

    return {
      step,
      stepCategories,
      stepName,
      stepQuestions,
      isLastStep,
    };
  }, [currentStep, answers, activeSteps, categoriesByStep]);

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center flex-wrap gap-2">
            {activeSteps.map((step, index) => {
              const stepIndex = index + 1;
              const stepName = step.name || `Step ${stepIndex}`;
              const isActive = currentStep === stepIndex;
              const isCompleted = currentStep > stepIndex;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isActive || isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {stepIndex}
                    </div>
                    <span className="ml-2 text-sm font-medium">{stepName}</span>
                  </div>
                  {index < activeSteps.length - 1 && (
                    <div className="mx-4 h-0.5 w-16 bg-gray-300"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Step Content */}
        {currentStepInfo && (
          <div key={currentStepInfo.step.id} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">{currentStepInfo.stepName}</h3>
                {currentStepInfo.step.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentStepInfo.step.description}</p>
                )}
              </div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Geri Dön
                </button>
              )}
            </div>

            {currentStep > 1 && (
              <div className="bg-yellow-50 p-4 rounded-md mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Filtrelenen sorular:</strong> Hastanın yaşı ({patientAge} yaş) ve
                  önceki cevaplarına göre bazı sorular dinamik olarak gösterilmektedir.
                </p>
              </div>
            )}

            {currentStepInfo.stepCategories.map((category) => {
              const categoryQuestions = currentStepInfo.stepQuestions.filter(
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
                          {!!q.is_required && <span className="text-red-600 ml-1">*</span>}
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

            <div className="flex gap-3">
              {!currentStepInfo.isLastStep && (
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Devam Et
                </button>
              )}
              {currentStepInfo.isLastStep && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Formu Kaydet'}
                </button>
              )}
            </div>
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
