export default function CriterionTable({ criteria, formatAnswer }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Soru
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Beklenen Cevap
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Verilen Cevap
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
              Durum
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {criteria.map((criterion) => (
            <tr key={criterion.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {criterion.question_text}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {criterion.accepted_values.join(' veya ')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                {formatAnswer(criterion.actual_answer)}
              </td>
              <td className="px-4 py-3 text-center">
                {criterion.matched ? (
                  <span className="text-green-600 text-lg">✓</span>
                ) : (
                  <span className="text-red-600 text-lg">✗</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

