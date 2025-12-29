import { requireUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import CarePlanItemsManager from '@/components/diagnoses/CarePlanItemsManager';

const db = require('@/lib/db');

async function getDiagnosis(id) {
  const diagnoses = await db.query(
    'SELECT * FROM nurse_diagnoses WHERE id = ?',
    [id]
  );
  if (diagnoses.length === 0) return null;

  return diagnoses[0];
}

async function getExpectedOutcomes(diagnosisId) {
  return await db.query(
    `SELECT id, outcome_text, order_index, created_at, updated_at
     FROM diagnosis_expected_outcomes
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );
}

async function getInterventions(diagnosisId) {
  return await db.query(
    `SELECT id, intervention_text, order_index, created_at, updated_at
     FROM diagnosis_interventions
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );
}

async function getEvaluationOptions(diagnosisId) {
  return await db.query(
    `SELECT id, option_text, option_value, order_index, created_at, updated_at
     FROM diagnosis_evaluation_options
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );
}

export default async function CarePlanItemsPage({ params }) {
  await requireUser();
  const { id } = await params;
  const diagnosis = await getDiagnosis(id);

  if (!diagnosis) {
    notFound();
  }

  const expectedOutcomes = await getExpectedOutcomes(id);
  const interventions = await getInterventions(id);
  const evaluationOptions = await getEvaluationOptions(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hemşire Tanıları', href: '/diagnoses' },
        { label: 'Bakım Planı Öğeleri' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{diagnosis.name}</h2>
            <p className="text-gray-600 mt-2">{diagnosis.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Bu sayfada tanıya özel beklenen sonuç kriterleri ve girişimleri yönetebilirsiniz.
            </p>
          </div>

          <CarePlanItemsManager
            diagnosisId={diagnosis.id}
            expectedOutcomes={expectedOutcomes}
            interventions={interventions}
            evaluationOptions={evaluationOptions}
          />
        </div>
      </main>
    </div>
  );
}

