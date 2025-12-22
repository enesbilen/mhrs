import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/questions/[id] - Get single question
export async function GET(request, { params }) {
  try {
    
    const { id } = await params;
const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questions = await db.query(
      `SELECT q.*, c.name as category_name
       FROM anamnesis_questions q
       LEFT JOIN anamnesis_categories c ON q.category_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 });
    }

    const question = questions[0];
    return NextResponse.json({
      ...question,
      options: question.options_json ? JSON.parse(question.options_json) : null,
      criteria: question.criteria_json ? JSON.parse(question.criteria_json) : [],
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Soru getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT /api/anamnesis/questions/[id] - Update question
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      category_id,
      question_text,
      question_type,
      is_required,
      options,
      criteria,
      order_index,
    } = body;

    // Validate
    if (!question_text || !question_type) {
      return NextResponse.json(
        { error: 'Soru metni ve tipi gerekli' },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE anamnesis_questions
       SET category_id = ?, question_text = ?, question_type = ?,
           is_required = ?, options_json = ?, criteria_json = ?, order_index = ?
       WHERE id = ?`,
      [
        category_id || null,
        question_text,
        question_type,
        is_required || false,
        options ? JSON.stringify(options) : null,
        criteria ? JSON.stringify(criteria) : null,
        order_index || 0,
        id,
      ]
    );

    return NextResponse.json({ message: 'Soru güncellendi' });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Soru güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/anamnesis/questions/[id] - Delete question
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if question is used in any diagnosis criteria
    const usages = await db.query(
      'SELECT id FROM diagnosis_criteria WHERE question_id = ?',
      [id]
    );

    if (usages.length > 0) {
      return NextResponse.json(
        {
          error:
            'Bu soru hemşire tanılarında kullanılıyor. Önce tanılardan kaldırın.',
        },
        { status: 400 }
      );
    }

    await db.execute('DELETE FROM anamnesis_questions WHERE id = ?', [
      id,
    ]);

    return NextResponse.json({ message: 'Soru silindi' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Soru silinemedi' }, { status: 500 });
  }
}
