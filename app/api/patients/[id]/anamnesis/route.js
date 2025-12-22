import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// POST /api/patients/[id]/anamnesis - Create new anamnesis form
export async function POST(request, { params }) {
  try {
    
    const { id } = await params;
const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { static_answers, dynamic_answers } = body;

    // Start transaction
    const result = await db.transaction(async (connection) => {
      // 1. Insert form
      const [formResult] = await connection.execute(
        'INSERT INTO anamnesis_forms (patient_id, created_by, static_answers_json) VALUES (?, ?, ?)',
        [id, user.id, JSON.stringify(static_answers)]
      );

      const formId = formResult.insertId;

      // 2. Insert answers
      for (const [questionId, answerValue] of Object.entries(dynamic_answers)) {
        await connection.execute(
          'INSERT INTO anamnesis_answers (form_id, question_id, answer_value) VALUES (?, ?, ?)',
          [formId, questionId, JSON.stringify(answerValue)]
        );
      }

      // 3. Calculate diagnosis suggestions
      await calculateDiagnosisSuggestions(connection, formId, dynamic_answers);

      return formId;
    });

    return NextResponse.json(
      { message: 'Form kaydedildi', formId: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating anamnesis form:', error);
    return NextResponse.json(
      { error: 'Form kaydedilemedi' },
      { status: 500 }
    );
  }
}

// Calculate diagnosis suggestions based on answers
async function calculateDiagnosisSuggestions(connection, formId, answers) {
  // Get all diagnoses with their criteria
  const [diagnoses] = await connection.query(
    'SELECT * FROM nurse_diagnoses'
  );

  for (const diagnosis of diagnoses) {
    // Get criteria for this diagnosis
    const [criteria] = await connection.query(
      `SELECT dc.*, q.question_type
       FROM diagnosis_criteria dc
       JOIN anamnesis_questions q ON dc.question_id = q.id
       WHERE dc.diagnosis_id = ?`,
      [diagnosis.id]
    );

    if (criteria.length === 0) continue;

    let matchedCount = 0;

    // Check each criterion
    for (const criterion of criteria) {
      const answerValue = answers[criterion.question_id];
      if (!answerValue) continue;

      const acceptedValues = JSON.parse(criterion.accepted_values_json);

      // Parse answer value (it's stored as JSON)
      let actualAnswer;
      try {
        actualAnswer = typeof answerValue === 'string' ? answerValue : JSON.parse(JSON.stringify(answerValue));
      } catch {
        actualAnswer = answerValue;
      }

      // Check if answer matches any accepted value
      let isMatch = false;

      if (typeof actualAnswer === 'string') {
        isMatch = acceptedValues.includes(actualAnswer);
      } else if (Array.isArray(actualAnswer)) {
        // For multiple choice, check if any selected option is accepted
        isMatch = actualAnswer.some((a) => acceptedValues.includes(a));
      } else if (typeof actualAnswer === 'object' && actualAnswer.answer) {
        // For yes_no_with_note
        isMatch = acceptedValues.includes(actualAnswer.answer);
      }

      if (isMatch) {
        matchedCount++;
      }
    }

    // If enough criteria matched, save suggestion
    if (matchedCount >= diagnosis.min_criteria_count) {
      await connection.execute(
        'INSERT INTO patient_diagnosis_suggestions (form_id, diagnosis_id, matched_criteria_count) VALUES (?, ?, ?)',
        [formId, diagnosis.id, matchedCount]
      );
    }
  }
}
