'use client';

import { useState } from 'react';
import AnamnesisHeader from './AnamnesisHeader';
import ViewModeButtons from './ViewModeButtons';
import StepView from './StepView';
import CategoryView from './CategoryView';
import FlatView from './FlatView';
import DiagnosesSection from './DiagnosesSection';

export default function AnamnesisResults({
  patient,
  form,
  answers,
  matchedDiagnoses,
  unmatchedDiagnoses,
  categories,
}) {
  const [viewMode, setViewMode] = useState('step');
  const [expandedSteps, setExpandedSteps] = useState({});

  // Group categories by step
  const categoriesByStep = categories.reduce((acc, cat) => {
    const stepId = cat.step_id || cat.step_order || 1;
    if (!acc[stepId]) {
      acc[stepId] = [];
    }
    acc[stepId].push(cat);
    return acc;
  }, {});

  // Get unique steps sorted
  const steps = Object.keys(categoriesByStep)
    .map(Number)
    .sort((a, b) => a - b);

  const toggleStep = (stepNum) => {
    setExpandedSteps({
      ...expandedSteps,
      [stepNum]: !expandedSteps[stepNum],
    });
  };

  const formatAnswer = (answer) => {
    if (answer === null || answer === undefined) {
      return 'Cevaplanmadı';
    }
    if (typeof answer === 'string') return answer;
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object' && answer !== null) {
      if (answer.answer) {
        if (answer.note) {
          return `${answer.answer} - ${answer.note}`;
        }
        return answer.answer;
      }
      return JSON.stringify(answer);
    }
    return 'Cevaplanmadı';
  };

  return (
    <div className="space-y-6">
      <AnamnesisHeader patient={patient} form={form} />

      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Anamnez Soruları ve Cevaplar</h3>
          <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {viewMode === 'step' && (
          <StepView
            steps={steps}
            categoriesByStep={categoriesByStep}
            answers={answers}
            expandedSteps={expandedSteps}
            toggleStep={toggleStep}
          />
        )}

        {viewMode === 'category' && (
          <CategoryView categories={categories} answers={answers} />
        )}

        {viewMode === 'flat' && <FlatView answers={answers} />}
      </div>

      <DiagnosesSection 
        diagnoses={matchedDiagnoses}
        formatAnswer={formatAnswer}
        title="Eşleşen Hemşire Tanıları"
        emptyMessage="Bu anamneze uygun hemşire tanısı bulunamadı."
        isMatched={true}
        patientId={patient.id}
        formId={form.id}
      />

      <DiagnosesSection
        diagnoses={unmatchedDiagnoses}
        formatAnswer={formatAnswer}
        title="Eşleşmeyen Hemşire Tanıları"
        emptyMessage="Tüm tanılar eşleşti!"
        isMatched={false}
        patientId={patient.id}
        formId={form.id}
      />
    </div>
  );
}
