import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/questions/[id]/conditions - Get conditions for a question
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conditions = await db.query(
      `SELECT qc.*, q.question_text as depends_on_question_text
       FROM question_conditions qc
       LEFT JOIN anamnesis_questions q ON qc.depends_on_question_id = q.id
       WHERE qc.question_id = ?
       ORDER BY qc.id`,
      [id]
    );

    return NextResponse.json(conditions);
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return NextResponse.json(
      { error: 'Koşullar getirilemedi' },
      { status: 500 }
    );
  }
}
