'use client';

import { useState } from 'react';

const STATIC_LABELS = {
  developmental_neurological: 'Gelişimsel/Nörolojik Durum',
  allergies: 'Bilinen Alerjisi',
  chronic_disease: 'Kronik Hastalık',
  surgery: 'Geçirilmiş Ameliyat',
  home_medication: 'Evde Kullandığı İlaç',
  admission_from: 'Yoğun Bakıma Nereden Geldi',
  brought_equipment: 'Yanında Cihaz',
  consciousness: 'Bilinç Durumu',
};

export default function AnamnesisResults({
  patient,
  form,
  answers,
  matchedDiagnoses,
  unmatchedDiagnoses,
  categories,
}) {
  const [viewMode, setViewMode] = useState('category'); // 'category' or 'flat'
  const [expandedDiagnoses, setExpandedDiagnoses] = useState({});

  const toggleDiagnosis = (id) => {
    setExpandedDiagnoses({
      ...expandedDiagnoses,
      [id]: !expandedDiagnoses[id],
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
        // Handle answers with notes
        if (answer.note) {
          return `${answer.answer} (${answer.note})`;
        }
        // Handle medication list
        if (answer.medications && Array.isArray(answer.medications)) {
          return answer.answer; // Will be handled separately
        }
        return answer.answer;
      }
      return JSON.stringify(answer);
    }
    return 'Cevaplanmadı';
  };

  const formatStaticAnswer = (key, value) => {
    // Handle medication list specially
    if (key === 'home_medication' && typeof value === 'object' && value.medications) {
      if (value.answer === 'Hayır') {
        return 'Hayır';
      }
      if (!value.medications || value.medications.length === 0) {
        return 'Evet (İlaç bilgisi girilmemiş)';
      }
      return (
        <div className="space-y-2">
          <div className="font-semibold">{value.answer}</div>
          <div className="mt-2 space-y-3">
            {value.medications.map((med, idx) => (
              <div key={idx} className="bg-white rounded-md p-3 border border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">İlaç:</span>{' '}
                    <span className="text-gray-900">{med.name || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Doz:</span>{' '}
                    <span className="text-gray-900">{med.dose || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sıklık:</span>{' '}
                    <span className="text-gray-900">{med.frequency || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Yol:</span>{' '}
                    <span className="text-gray-900">{med.route || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Handle other object answers (with notes)
    if (typeof value === 'object' && value.answer) {
      if (value.note) {
        return (
          <div>
            <div className="font-semibold">{value.answer}</div>
            <div className="text-sm text-gray-600 mt-1">{value.note}</div>
          </div>
        );
      }
      return value.answer;
    }
    
    // Handle string values
    return value;
  };

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Anamnez Sonuçları</h2>
        <p className="text-gray-600">
          Hasta: {patient.first_name} {patient.last_name} |
          Dosya No: {patient.file_no} |
          Tarih: {new Date(form.created_at).toLocaleString('tr-TR')}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Oluşturan: {form.created_by_name}
        </p>
      </div>

      {/* Section 1: Static Questions (Genel Değerlendirme) */}
      <div className="bg-blue-50 border-l-4 border-blue-500 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📋 Genel Değerlendirme (Statik Sorular)
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(form.static_answers).map(([key, value]) => (
            <div key={key} className={key === 'home_medication' ? 'md:col-span-2' : ''}>
              <dt className="text-sm font-medium text-blue-700">
                {STATIC_LABELS[key] || key}
              </dt>
              <dd className="mt-1 text-sm text-blue-900 font-semibold">
                {formatStaticAnswer(key, value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Section 2: Dynamic Questions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📝 Anamnez Soruları ve Cevaplar</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'category'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Kategorilere Göre
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'flat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Düz Liste
            </button>
          </div>
        </div>

        {viewMode === 'category' ? (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryAnswers = answers.filter(
                (a) => a.category_name === category.name
              );

              if (categoryAnswers.length === 0) return null;

              return (
                <div key={category.id} className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {category.name}
                  </h4>
                  <div className="space-y-3 pl-4">
                    {categoryAnswers.map((answer) => (
                      <div key={answer.id} className="border-l-2 border-gray-300 pl-4">
                        <p className="text-sm font-medium text-gray-700">
                          {answer.question_text}
                        </p>
                        <p className="text-sm text-gray-900 mt-1 font-semibold">
                          → {formatAnswer(answer.answer_value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((answer, idx) => (
              <div key={answer.id} className="border-b pb-3">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {answer.question_text}
                      {answer.category_name && (
                        <span className="ml-2 text-xs text-gray-500">
                          [{answer.category_name}]
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">
                      → {formatAnswer(answer.answer_value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Matched Diagnoses (Eşleşen Tanılar) */}
      <div className="bg-green-50 border-l-4 border-green-500 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          ✅ Eşleşen Hemşire Tanıları ({matchedDiagnoses.length})
        </h3>

        {matchedDiagnoses.length === 0 ? (
          <p className="text-green-700">
            Bu anamneze uygun hemşire tanısı bulunamadı.
          </p>
        ) : (
          <div className="space-y-4">
            {matchedDiagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="bg-white rounded-lg shadow-sm border border-green-200">
                <button
                  onClick={() => toggleDiagnosis(diagnosis.diagnosis_id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-50"
                >
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">{diagnosis.name}</h4>
                    {diagnosis.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {diagnosis.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                      {diagnosis.matched_criteria_count}/{diagnosis.criteria.length} kriter ✓
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        expandedDiagnoses[diagnosis.diagnosis_id] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedDiagnoses[diagnosis.diagnosis_id] && (
                  <div className="px-4 pb-4 border-t border-green-200">
                    <h5 className="font-medium text-gray-900 mt-3 mb-2">
                      Kriter Detayları:
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Soru
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Beklenen Cevap
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Verilen Cevap
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                              Durum
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {diagnosis.criteria.map((criterion) => (
                            <tr key={criterion.id}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {criterion.question_text}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {criterion.accepted_values.join(' veya ')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                                {formatAnswer(criterion.actual_answer)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {criterion.matched ? (
                                  <span className="text-green-600 text-xl">✓</span>
                                ) : (
                                  <span className="text-red-600 text-xl">✗</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Unmatched Diagnoses (Eşleşmeyen Tanılar) */}
      <div className="bg-orange-50 border-l-4 border-orange-500 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">
          ⚠️ Eşleşmeyen Hemşire Tanıları ({unmatchedDiagnoses.length})
        </h3>

        {unmatchedDiagnoses.length === 0 ? (
          <p className="text-orange-700">Tüm tanılar eşleşti!</p>
        ) : (
          <div className="space-y-4">
            {unmatchedDiagnoses.map((diagnosis) => {
              const missingCount = diagnosis.min_criteria_count - diagnosis.matched_count;
              const unmatchedCriteria = diagnosis.criteria.filter((c) => !c.matched);

              return (
                <div key={diagnosis.id} className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
                  <h4 className="font-semibold text-gray-900">{diagnosis.name}</h4>
                  {diagnosis.description && (
                    <p className="text-sm text-gray-600 mt-1">{diagnosis.description}</p>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="px-3 py-1 bg-orange-200 text-orange-900 rounded-full">
                        {diagnosis.matched_count}/{diagnosis.min_criteria_count} kriter
                        ({missingCount} kriter daha gerekli)
                      </span>
                    </div>

                    {unmatchedCriteria.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Eksik Kriterler:
                        </h5>
                        <ul className="space-y-2">
                          {unmatchedCriteria.map((c) => (
                            <li key={c.id} className="text-sm text-orange-800 pl-4 border-l-2 border-orange-300">
                              <strong>{c.question_text}</strong>
                              <br />
                              <span className="text-gray-600">
                                Beklenen: {c.accepted_values.join(' veya ')} |
                                Verilen: {formatAnswer(c.actual_answer) || 'Cevaplanmadı'}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                          <h6 className="font-medium text-yellow-900 text-sm mb-1">
                            💡 Öneri:
                          </h6>
                          <p className="text-sm text-yellow-800">
                            Eğer aşağıdaki soruların cevapları farklı olsaydı, bu tanı önerilirdi:
                          </p>
                          <ul className="mt-2 space-y-1">
                            {unmatchedCriteria.map((c) => (
                              <li key={c.id} className="text-xs text-yellow-800 ml-4">
                                • {c.question_text}: {c.accepted_values.join(' veya ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
