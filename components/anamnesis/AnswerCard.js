import MedicationList from './MedicationList';

export default function AnswerCard({ answer, formatAnswer, showCategory = false }) {
  const formatAnswerValue = formatAnswer || ((answer, questionType) => {
    if (answer === null || answer === undefined) {
      return 'Cevaplanmadı';
    }
    if (typeof answer === 'string') return answer;
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object' && answer !== null) {
      if (answer.answer) {
        if (answer.medications && Array.isArray(answer.medications)) {
          if (answer.answer === 'Hayır') {
            return 'Hayır';
          }
          return (
            <div>
              <div className="font-medium">{answer.answer}</div>
              <MedicationList medications={answer.medications} />
            </div>
          );
        }
        if (answer.note) {
          return (
            <div>
              <div className="font-medium">{answer.answer}</div>
              <div className="text-sm text-gray-600 mt-1">{answer.note}</div>
            </div>
          );
        }
        return answer.answer;
      }
      return JSON.stringify(answer);
    }
    return 'Cevaplanmadı';
  });

  return (
    <div className="border border-gray-200 rounded p-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-gray-900 flex-1">{answer.question_text}</p>
        {showCategory && answer.category_name && (
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {answer.category_name}
            </span>
            {answer.category_step && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                Step {answer.category_step}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-700">
        {formatAnswerValue(answer.answer_value, answer.question_type)}
      </div>
    </div>
  );
}

