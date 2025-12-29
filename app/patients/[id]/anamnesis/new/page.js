import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnamnesisFormWizard from '@/components/anamnesis/AnamnesisFormWizard';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getPatient(id) {
  const patients = await db.query(
    'SELECT * FROM patients WHERE id = ? AND archived = FALSE',
    [id]
  );
  return patients.length > 0 ? patients[0] : null;
}

async function getQuestions() {
  const questions = await db.query(
    `SELECT q.*, c.name as category_name, c.order_index as category_order
     FROM anamnesis_questions q
     LEFT JOIN anamnesis_categories c ON q.category_id = c.id
     ORDER BY c.order_index, q.order_index`
  );

  // Fetch all conditions
  const conditions = await db.query(
    `SELECT * FROM question_conditions`
  );

  // Group conditions by question_id
  const conditionsByQuestion = conditions.reduce((acc, cond) => {
    if (!acc[cond.question_id]) {
      acc[cond.question_id] = [];
    }
    acc[cond.question_id].push(cond);
    return acc;
  }, {});

  return questions.map((q) => ({
    ...q,
    options: q.options_json ? JSON.parse(q.options_json) : null,
    criteria: q.criteria_json ? JSON.parse(q.criteria_json) : [],
    conditions: conditionsByQuestion[q.id] || [],
  }));
}

async function getCategories() {
  return await db.query(
    `SELECT c.*, s.name as step_name, s.order_index as step_order, s.description as step_description, s.id as step_id
     FROM anamnesis_categories c
     LEFT JOIN anamnesis_steps s ON c.step_id = s.id
     ORDER BY s.order_index ASC, c.order_index ASC`
  );
}

async function getSteps() {
  return await db.query(
    `SELECT * FROM anamnesis_steps ORDER BY order_index ASC, id ASC`
  );
}

export default async function NewAnamnesisPage({ params }) {
  const user = await requireUser();
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const questions = await getQuestions();
  const categories = await getCategories();
  const steps = await getSteps();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi', href: '/patients' },
        { label: `${patient.first_name} ${patient.last_name}`, href: `/patients/${patient.id}` },
        { label: 'Yeni Anamnez Formu' }
      ]} />

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-2">
            Anamnez Formu - {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-gray-600 mb-6">
            Dosya No: {patient.file_no} | Yatak No: {patient.bed_no || '-'}
          </p>

          <AnamnesisFormWizard
            patient={patient}
            questions={questions}
            categories={categories}
            steps={steps}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
