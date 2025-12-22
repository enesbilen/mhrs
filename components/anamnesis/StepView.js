import AnswerCard from './AnswerCard';

export default function StepView({ steps, categoriesByStep, answers, expandedSteps, toggleStep }) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Henüz soru bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((stepNum) => {
        const stepCategories = categoriesByStep[stepNum] || [];
        const stepName = stepCategories[0]?.step_name || stepCategories[0]?.name || `Step ${stepNum}`;
        const isExpanded = expandedSteps[stepNum] !== false;
        const stepAnswers = answers.filter((a) => (a.category_step || a.step_id) === stepNum);

        if (stepAnswers.length === 0) return null;

        return (
          <div key={stepNum} className="border border-gray-200 rounded">
            <button
              onClick={() => toggleStep(stepNum)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {stepNum}
                </span>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">{stepName}</h4>
                  <p className="text-sm text-gray-500">
                    {stepAnswers.length} soru • {stepCategories.length} kategori
                  </p>
                </div>
              </div>
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
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4 pt-4">
                  {stepCategories.map((category) => {
                    const categoryAnswers = stepAnswers.filter(
                      (a) => a.category_name === category.name
                    );

                    if (categoryAnswers.length === 0) return null;

                    return (
                      <div key={category.id} className="bg-white rounded border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{category.name}</h5>
                          <span className="text-xs text-gray-500">
                            {categoryAnswers.length} soru
                          </span>
                        </div>
                        <div className="space-y-3">
                          {categoryAnswers.map((answer) => (
                            <AnswerCard key={answer.id} answer={answer} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

