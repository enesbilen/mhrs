import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import CriteriaManager from '@/components/diagnoses/CriteriaManager';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getDiagnosis(id) {
  const diagnoses = await db.query(
    'SELECT * FROM nurse_diagnoses WHERE id = ?',
    [id]
  );
  if (diagnoses.length === 0) return null;

  const definingCharacteristics = await db.query(
    'SELECT id, characteristic_text, order_index FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ? ORDER BY order_index ASC, id ASC',
    [id]
  );

  return {
    ...diagnoses[0],
    defining_characteristics: definingCharacteristics,
  };
}

async function getCriteria(diagnosisId) {
  const criteria = await db.query(
    `SELECT dc.*, q.question_text, q.question_type, q.options_json
     FROM diagnosis_criteria dc
     JOIN anamnesis_questions q ON dc.question_id = q.id
     WHERE dc.diagnosis_id = ?`,
    [diagnosisId]
  );

  return criteria.map((c) => ({
    ...c,
    accepted_values: JSON.parse(c.accepted_values_json),
    options: c.options_json ? JSON.parse(c.options_json) : null,
  }));
}

async function getAvailableQuestions() {
  const questions = await db.query(
    `SELECT q.*, c.name as category_name
     FROM anamnesis_questions q
     LEFT JOIN anamnesis_categories c ON q.category_id = c.id
     ORDER BY c.order_index, q.order_index`
  );

  return questions.map((q) => ({
    ...q,
    options: q.options_json ? JSON.parse(q.options_json) : null,
  }));
}

export default async function DiagnosisCriteriaPage({ params }) {
  await requireUser();
  const { id } = await params;
  const diagnosis = await getDiagnosis(id);

  if (!diagnosis) {
    notFound();
  }

  const criteria = await getCriteria(id);
  const questions = await getAvailableQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hemşire Tanıları', href: '/diagnoses' },
        { label: 'Kriter Yönetimi' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{diagnosis.name}</h2>
            <p className="text-gray-600 mt-2">{diagnosis.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Minimum {diagnosis.min_criteria_count} kriter gerekli
            </p>
            {diagnosis.defining_characteristics && diagnosis.defining_characteristics.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tanımlayıcı Özellikler:</h3>
                <div className="flex flex-wrap gap-2">
                  {diagnosis.defining_characteristics.map((char) => (
                    <span
                      key={char.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {char.characteristic_text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <CriteriaManager
            diagnosisId={diagnosis.id}
            existingCriteria={criteria}
            availableQuestions={questions}
          />
        </div>
      </main>
    </div>
  );
}
