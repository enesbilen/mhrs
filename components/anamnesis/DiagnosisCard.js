import { useState } from 'react';
import CriterionTable from './CriterionTable';

export default function DiagnosisCard({ diagnosis, formatAnswer, isMatched = true }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${isMatched ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            <h4 className="font-medium text-gray-900">{diagnosis.name}</h4>
          </div>
          {diagnosis.description && (
            <p className="text-sm text-gray-600">{diagnosis.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            {diagnosis.matched_criteria_count || diagnosis.matched_count}/
            {diagnosis.criteria?.length || diagnosis.min_criteria_count} kriter
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && isMatched && diagnosis.criteria && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
          <h5 className="font-medium text-gray-900 mt-4 mb-3">Kriter Detayları</h5>
          <CriterionTable criteria={diagnosis.criteria} formatAnswer={formatAnswer} />
        </div>
      )}

      {isExpanded && !isMatched && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
          <div className="mt-4 space-y-3">
            {diagnosis.criteria?.filter((c) => !c.matched).map((c) => (
              <div key={c.id} className="bg-white rounded p-3 border border-gray-200">
                <p className="font-medium text-gray-900 mb-2 text-sm">{c.question_text}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Beklenen:</span>
                    <span className="ml-2 text-gray-900">{c.accepted_values.join(' veya ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Verilen:</span>
                    <span className="ml-2 text-gray-900">
                      {formatAnswer(c.actual_answer) || 'Cevaplanmadı'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

