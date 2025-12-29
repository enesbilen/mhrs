import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnamnesisResults from '@/components/anamnesis/AnamnesisResults';
import Header from '@/components/common/Header';

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

  if (forms.length === 0) return null;

  const form = forms[0];
  return {
    ...form,
    static_answers: form.static_answers_json ? JSON.parse(form.static_answers_json) : {},
  };
}

async function getAnswers(formId) {
  const answers = await db.query(
    `SELECT aa.*, q.question_text, q.question_type, q.options_json, 
            c.name as category_name, s.order_index as category_step, c.order_index as category_order,
            s.name as step_name, s.id as step_id
     FROM anamnesis_answers aa
     JOIN anamnesis_questions q ON aa.question_id = q.id
     LEFT JOIN anamnesis_categories c ON q.category_id = c.id
     LEFT JOIN anamnesis_steps s ON c.step_id = s.id
     WHERE aa.form_id = ?
     ORDER BY s.order_index ASC, c.order_index ASC, q.order_index ASC`,
    [formId]
  );

  return answers.map((a) => ({
    ...a,
    answer_value: JSON.parse(a.answer_value),
    options: a.options_json ? JSON.parse(a.options_json) : null,
  }));
}

async function getMatchedDiagnoses(formId) {
  const matched = await db.query(
    `SELECT pds.*, nd.name, nd.description, nd.min_criteria_count
     FROM patient_diagnosis_suggestions pds
     JOIN nurse_diagnoses nd ON pds.diagnosis_id = nd.id
     WHERE pds.form_id = ?`,
    [formId]
  );

  // For each diagnosis, get detailed criteria matching
  const withDetails = await Promise.all(
    matched.map(async (d) => {
      const criteria = await db.query(
        `SELECT dc.*, q.question_text, q.question_type, q.options_json
         FROM diagnosis_criteria dc
         JOIN anamnesis_questions q ON dc.question_id = q.id
         WHERE dc.diagnosis_id = ?`,
        [d.diagnosis_id]
      );

      const answers = await db.query(
        `SELECT aa.*
         FROM anamnesis_answers aa
         WHERE aa.form_id = ? AND aa.question_id IN (?)`,
        [formId, criteria.map((c) => c.question_id)]
      );

      const criteriaWithMatches = criteria.map((c) => {
        const answer = answers.find((a) => a.question_id == c.question_id);
        const acceptedValues = JSON.parse(c.accepted_values_json);
        const actualAnswer = answer ? JSON.parse(answer.answer_value) : null;

        let matched = false;
        if (actualAnswer) {
          if (typeof actualAnswer === 'string') {
            matched = acceptedValues.includes(actualAnswer);
          } else if (Array.isArray(actualAnswer)) {
            matched = actualAnswer.some((a) => acceptedValues.includes(a));
          } else if (actualAnswer.answer) {
            matched = acceptedValues.includes(actualAnswer.answer);
          }
        }

        return {
          ...c,
          accepted_values: acceptedValues,
          actual_answer: actualAnswer,
          matched,
        };
      });

      return {
        ...d,
        criteria: criteriaWithMatches,
      };
    })
  );

  return withDetails;
}

async function getAllDiagnoses() {
  return await db.query('SELECT * FROM nurse_diagnoses');
}

async function getUnmatchedDiagnoses(formId, matchedIds) {
  const allDiagnoses = await getAllDiagnoses();
  const unmatched = allDiagnoses.filter(
    (d) => !matchedIds.includes(d.id)
  );

  // For each unmatched, calculate why it didn't match
  const withDetails = await Promise.all(
    unmatched.map(async (d) => {
      const criteria = await db.query(
        `SELECT dc.*, q.question_text
         FROM diagnosis_criteria dc
         JOIN anamnesis_questions q ON dc.question_id = q.id
         WHERE dc.diagnosis_id = ?`,
        [d.id]
      );

      if (criteria.length === 0) {
        return {
          ...d,
          matched_count: 0,
          criteria: [],
          reason: 'Bu tanı için henüz kriter tanımlanmamış',
        };
      }

      const answers = await db.query(
        `SELECT aa.*
         FROM anamnesis_answers aa
         WHERE aa.form_id = ? AND aa.question_id IN (?)`,
        [formId, criteria.map((c) => c.question_id)]
      );

      let matchedCount = 0;
      const criteriaWithMatches = criteria.map((c) => {
        const answer = answers.find((a) => a.question_id == c.question_id);
        const acceptedValues = JSON.parse(c.accepted_values_json);
        const actualAnswer = answer ? JSON.parse(answer.answer_value) : null;

        let matched = false;
        if (actualAnswer) {
          if (typeof actualAnswer === 'string') {
            matched = acceptedValues.includes(actualAnswer);
          } else if (Array.isArray(actualAnswer)) {
            matched = actualAnswer.some((a) => acceptedValues.includes(a));
          } else if (actualAnswer.answer) {
            matched = acceptedValues.includes(actualAnswer.answer);
          }
        }

        if (matched) matchedCount++;

        return {
          ...c,
          accepted_values: acceptedValues,
          actual_answer: actualAnswer,
          matched,
        };
      });

      return {
        ...d,
        matched_count: matchedCount,
        criteria: criteriaWithMatches,
      };
    })
  );

  return withDetails;
}

async function getCategories() {
  return await db.query(
    `SELECT c.*, s.name as step_name, s.order_index as step_order, s.description as step_description, s.id as step_id
     FROM anamnesis_categories c
     LEFT JOIN anamnesis_steps s ON c.step_id = s.id
     ORDER BY s.order_index ASC, c.order_index ASC`
  );
}

export default async function AnamnesisResultsPage({ params }) {
  await requireUser();
  const { id, formId } = await params;
  const patient = await getPatient(id);
  const form = await getForm(formId);

  if (!patient || !form) {
    notFound();
  }

  const answers = await getAnswers(formId);
  const matchedDiagnoses = await getMatchedDiagnoses(formId);
  const unmatchedDiagnoses = await getUnmatchedDiagnoses(
    formId,
    matchedDiagnoses.map((d) => d.diagnosis_id)
  );
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Hasta Yönetimi', href: '/patients' },
        { label: `${patient.first_name} ${patient.last_name}`, href: `/patients/${patient.id}` },
        { label: 'Anamnez Sonuçları' }
      ]} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AnamnesisResults
          patient={patient}
          form={form}
          answers={answers}
          matchedDiagnoses={matchedDiagnoses}
          unmatchedDiagnoses={unmatchedDiagnoses}
          categories={categories}
        />
      </main>
    </div>
  );
}
