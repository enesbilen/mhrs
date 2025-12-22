import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// POST /api/diagnoses/[id]/criteria - Add criterion (question) to diagnosis
export async function POST(request, { params }) {
  try {
    
    const { id } = await params;
const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question_id, accepted_values } = body;

    if (!question_id || !accepted_values || accepted_values.length === 0) {
      return NextResponse.json(
        { error: 'Soru ID ve kabul edilen cevaplar gerekli' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await db.query(
      'SELECT id FROM diagnosis_criteria WHERE diagnosis_id = ? AND question_id = ?',
      [id, question_id]
    );

    let criterionId;
    if (existing.length > 0) {
      // Update existing
      await db.execute(
        'UPDATE diagnosis_criteria SET accepted_values_json = ? WHERE id = ?',
        [JSON.stringify(accepted_values), existing[0].id]
      );
      criterionId = existing[0].id;
    } else {
      // Insert new
      const result = await db.execute(
        'INSERT INTO diagnosis_criteria (diagnosis_id, question_id, accepted_values_json) VALUES (?, ?, ?)',
        [id, question_id, JSON.stringify(accepted_values)]
      );
      criterionId = result.insertId;
    }

    // Get the full criterion data with question info
    const criterion = await db.query(
      `SELECT dc.*, q.question_text, q.question_type, q.options_json
       FROM diagnosis_criteria dc
       JOIN anamnesis_questions q ON dc.question_id = q.id
       WHERE dc.id = ?`,
      [criterionId]
    );

    const fullCriterion = {
      ...criterion[0],
      accepted_values: JSON.parse(criterion[0].accepted_values_json),
      options: criterion[0].options_json ? JSON.parse(criterion[0].options_json) : null,
    };

    return NextResponse.json({
      message: 'Kriter eklendi',
      criterion: fullCriterion
    });
  } catch (error) {
    console.error('Error adding criterion:', error);
    return NextResponse.json(
      { error: 'Kriter eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[diagnosisId]/criteria/[criterionId]
// We'll handle this in a separate route for clarity
