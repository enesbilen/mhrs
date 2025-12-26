import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/questions - List all questions
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let query = `
      SELECT q.*, c.name as category_name
      FROM anamnesis_questions q
      LEFT JOIN anamnesis_categories c ON q.category_id = c.id
    `;

    const params = [];
    if (categoryId) {
      query += ' WHERE q.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY q.order_index ASC, q.id ASC';

    const questions = await db.query(query, params);

    // Parse JSON fields
    const parsedQuestions = questions.map((q) => ({
      ...q,
      options: q.options_json ? JSON.parse(q.options_json) : null,
      criteria: q.criteria_json ? JSON.parse(q.criteria_json) : [],
    }));

    return NextResponse.json(parsedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Sorular getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/anamnesis/questions - Create new question
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id,
      question_text,
      question_type,
      is_required,
      options,
      criteria,
      order_index,
      conditions,
    } = body;

    // Validate
    if (!question_text || !question_type) {
      return NextResponse.json(
        { error: 'Soru metni ve tipi gerekli' },
        { status: 400 }
      );
    }

    const validTypes = [
      'yes_no',
      'yes_no_with_note',
      'text_input',
      'number_input',
      'single_choice',
      'multiple_choice',
      'medication_list',
    ];

    if (!validTypes.includes(question_type)) {
      return NextResponse.json(
        { error: 'Geçersiz soru tipi' },
        { status: 400 }
      );
    }

    // For choice questions, options are required
    if (
      (question_type === 'single_choice' ||
        question_type === 'multiple_choice') &&
      (!options || options.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Seçenekli sorular için seçenekler gerekli' },
        { status: 400 }
      );
    }

    const result = await db.execute(
      `INSERT INTO anamnesis_questions
       (category_id, question_text, question_type, is_required, options_json, criteria_json, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        question_text,
        question_type,
        is_required || false,
        options ? JSON.stringify(options) : null,
        criteria ? JSON.stringify(criteria) : null,
        order_index || 0,
      ]
    );

    const questionId = result.insertId;

    // Save conditions if provided
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        const conditionValues = Array.isArray(condition.condition_value)
          ? condition.condition_value
          : [];

        if (
          condition.depends_on_question_id &&
          conditionValues.length > 0
        ) {
          await db.execute(
            `INSERT INTO question_conditions
             (question_id, depends_on_question_id, action, condition_value)
             VALUES (?, ?, ?, ?)`,
            [
              questionId,
              condition.depends_on_question_id,
              condition.action || 'hide',
              JSON.stringify(conditionValues),
            ]
          );
        }
      }
    }

    return NextResponse.json(
      { message: 'Soru oluşturuldu', id: questionId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Soru oluşturulamadı' },
      { status: 500 }
    );
  }
}
