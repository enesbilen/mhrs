import { requireUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import CarePlanForm, { CarePlanResults } from '@/components/anamnesis/CarePlanForm';

const db = require('@/lib/db');

async function getPatient(id) {
  const patients = await db.query('SELECT * FROM patients WHERE id = ?', [id]);
  return patients.length > 0 ? patients[0] : null;
}

async function getForm(formId) {
  const forms = await db.query(
    `SELECT af.*, u.username as created_by_name
     FROM anamnesis_forms af
     LEFT JOIN users u ON af.created_by = u.id
     WHERE af.id = ?`,
    [formId]
  );
  return forms.length > 0 ? forms[0] : null;
}

async function getDiagnosis(diagnosisId) {
  const diagnoses = await db.query(
    'SELECT * FROM nurse_diagnoses WHERE id = ?',
    [diagnosisId]
  );
  if (diagnoses.length === 0) return null;

  const definingCharacteristics = await db.query(
    `SELECT id, characteristic_text, order_index
     FROM nurse_diagnosis_defining_characteristics
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );

  return {
    ...diagnoses[0],
    defining_characteristics: definingCharacteristics,
  };
}

async function getCarePlan(patientId, formId, diagnosisId) {
  const carePlans = await db.query(
    `SELECT * FROM nurse_care_plans
     WHERE patient_id = ? AND form_id = ? AND diagnosis_id = ?`,
    [patientId, formId, diagnosisId]
  );
  
  return carePlans.length > 0 ? carePlans[0] : null;
}

async function getExpectedOutcomes(diagnosisId, carePlanId = null) {
  // Get all expected outcomes for this diagnosis (templates)
  const outcomes = await db.query(
    `SELECT id, outcome_text, order_index
     FROM diagnosis_expected_outcomes
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );

  // If care plan exists, mark which ones are selected
  if (carePlanId) {
    const selected = await db.query(
      `SELECT outcome_id FROM care_plan_selected_outcomes WHERE care_plan_id = ?`,
      [carePlanId]
    );
    const selectedIds = selected.map(s => s.outcome_id);
    return outcomes.map(o => ({
      ...o,
      selected: selectedIds.includes(o.id),
    }));
  }

  return outcomes.map(o => ({ ...o, selected: false }));
}

async function getInterventions(diagnosisId, carePlanId = null) {
  // Get all interventions for this diagnosis (templates)
  const interventions = await db.query(
    `SELECT id, intervention_text, order_index
     FROM diagnosis_interventions
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );

  // If care plan exists, mark which ones are selected
  if (carePlanId) {
    const selected = await db.query(
      `SELECT intervention_id FROM care_plan_selected_interventions WHERE care_plan_id = ?`,
      [carePlanId]
    );
    const selectedIds = selected.map(s => s.intervention_id);
    return interventions.map(i => ({
      ...i,
      selected: selectedIds.includes(i.id),
    }));
  }

  return interventions.map(i => ({ ...i, selected: false }));
}

async function getEvaluationOptions(diagnosisId) {
  return await db.query(
    `SELECT id, option_text, option_value, order_index
     FROM diagnosis_evaluation_options
     WHERE diagnosis_id = ?
     ORDER BY order_index ASC, id ASC`,
    [diagnosisId]
  );
}

export default async function CarePlanPage({ params }) {
  await requireUser();
  const { id, formId, diagnosisId } = await params;
  
  const patient = await getPatient(id);
  const form = await getForm(formId);
  const diagnosis = await getDiagnosis(diagnosisId);

  if (!patient || !form || !diagnosis) {
    notFound();
  }

  const carePlan = await getCarePlan(id, formId, diagnosisId);
  const expectedOutcomes = await getExpectedOutcomes(diagnosisId, carePlan?.id);
  const interventions = await getInterventions(diagnosisId, carePlan?.id);
  const evaluationOptions = await getEvaluationOptions(diagnosisId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi', href: '/patients' },
        { label: `${patient.first_name} ${patient.last_name}`, href: `/patients/${patient.id}` },
        { label: 'Anamnez Sonuçları', href: `/patients/${patient.id}/anamnesis/${formId}` },
        { label: 'Bakım Planı' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Hemşire Bakım Planı
            </h2>
            <p className="text-gray-600">
              <span className="font-medium">Tanı:</span> {diagnosis.name}
            </p>
            {diagnosis.description && (
              <p className="text-sm text-gray-500 mt-1">{diagnosis.description}</p>
            )}
          </div>

          <CarePlanForm
            patientId={id}
            formId={formId}
            diagnosisId={diagnosisId}
            diagnosis={diagnosis}
            carePlan={carePlan}
            expectedOutcomes={expectedOutcomes}
            interventions={interventions}
            evaluationOptions={evaluationOptions}
          />

          {carePlan && (
            <CarePlanResults
              carePlan={carePlan}
              expectedOutcomes={expectedOutcomes}
              interventions={interventions}
              evaluation={carePlan.evaluation}
              evaluationOptions={evaluationOptions}
            />
          )}
        </div>
      </main>
    </div>
  );
}

