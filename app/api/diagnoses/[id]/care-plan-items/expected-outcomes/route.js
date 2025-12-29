import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// POST /api/diagnoses/[id]/care-plan-items/expected-outcomes
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { outcome_text } = body;

    if (!outcome_text || !outcome_text.trim()) {
      return NextResponse.json(
        { error: 'Beklenen sonuç kriteri metni gerekli' },
        { status: 400 }
      );
    }

    // Check if duplicate exists (same diagnosis cannot have duplicate outcome_text)
    const existing = await db.query(
      'SELECT id FROM diagnosis_expected_outcomes WHERE diagnosis_id = ? AND outcome_text = ?',
      [id, outcome_text.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu beklenen sonuç kriteri zaten mevcut' },
        { status: 400 }
      );
    }

    // Get max order_index
    const maxOrder = await db.query(
      'SELECT MAX(order_index) as max_order FROM diagnosis_expected_outcomes WHERE diagnosis_id = ?',
      [id]
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;

    const result = await db.execute(
      `INSERT INTO diagnosis_expected_outcomes (diagnosis_id, outcome_text, order_index)
       VALUES (?, ?, ?)`,
      [id, outcome_text.trim(), nextOrder]
    );

    return NextResponse.json(
      { message: 'Beklenen sonuç kriteri eklendi', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expected outcome:', error);
    return NextResponse.json(
      { error: 'Beklenen sonuç kriteri eklenemedi' },
      { status: 500 }
    );
  }
}

