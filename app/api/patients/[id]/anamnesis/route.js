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
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Cevaplar bulunamadı' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (connection) => {
      // Get Step 1 category (Genel Değerlendirme)
      const [step1Categories] = await connection.query(
        'SELECT id FROM anamnesis_categories WHERE step = 1 LIMIT 1'
      );
      
      const step1CategoryId = step1Categories.length > 0 ? step1Categories[0].id : null;

      // Get Step 1 questions
      let step1Answers = {};
      let dynamicAnswers = {};

      if (step1CategoryId) {
        const [step1Questions] = await connection.query(
          'SELECT id FROM anamnesis_questions WHERE category_id = ?',
          [step1CategoryId]
        );

        // Separate Step 1 answers from other answers
        for (const [questionId, answerValue] of Object.entries(answers)) {
          const questionIdNum = parseInt(questionId);
          const isStep1Question = step1Questions.some(q => q.id === questionIdNum);
          
          if (isStep1Question) {
            step1Answers[questionId] = answerValue;
          } else {
            dynamicAnswers[questionId] = answerValue;
          }
        }
      } else {
        // If no Step 1 category found, treat all as dynamic
        dynamicAnswers = answers;
      }

      // 1. Insert form
      const [formResult] = await connection.execute(
        'INSERT INTO anamnesis_forms (patient_id, created_by, static_answers_json) VALUES (?, ?, ?)',
        [id, user.id, JSON.stringify(step1Answers)]
      );

      const formId = formResult.insertId;

      // 2. Insert answers (all questions including Step 1, for consistency)
      for (const [questionId, answerValue] of Object.entries(answers)) {
        if (answerValue !== undefined && answerValue !== null) {
          await connection.execute(
            'INSERT INTO anamnesis_answers (form_id, question_id, answer_value) VALUES (?, ?, ?)',
            [formId, questionId, JSON.stringify(answerValue)]
          );
        }
      }

      // 3. Calculate diagnosis suggestions
      await calculateDiagnosisSuggestions(connection, formId, answers);

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
