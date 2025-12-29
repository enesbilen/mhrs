import DiagnosisCard from './DiagnosisCard';

export default function DiagnosesSection({ 
  diagnoses, 
  formatAnswer, 
  title, 
  emptyMessage,
  isMatched = true,
  patientId,
  formId
}) {
  return (
    <div className="bg-white border border-gray-200 rounded p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {title} ({diagnoses.length})
      </h3>

      {diagnoses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnoses.map((diagnosis) => (
            <DiagnosisCard
              key={diagnosis.id}
              diagnosis={diagnosis}
              formatAnswer={formatAnswer}
              isMatched={isMatched}
              patientId={patientId}
              formId={formId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

