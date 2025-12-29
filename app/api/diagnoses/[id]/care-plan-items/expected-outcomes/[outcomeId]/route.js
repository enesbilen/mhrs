import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// PUT /api/diagnoses/[id]/care-plan-items/expected-outcomes/[outcomeId]
export async function PUT(request, { params }) {
  try {
    const { id, outcomeId } = await params;
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

    await db.execute(
      `UPDATE diagnosis_expected_outcomes
       SET outcome_text = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND diagnosis_id = ?`,
      [outcome_text.trim(), outcomeId, id]
    );

    return NextResponse.json(
      { message: 'Beklenen sonuç kriteri güncellendi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expected outcome:', error);
    return NextResponse.json(
      { error: 'Beklenen sonuç kriteri güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[id]/care-plan-items/expected-outcomes/[outcomeId]
export async function DELETE(request, { params }) {
  try {
    const { id, outcomeId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute(
      'DELETE FROM diagnosis_expected_outcomes WHERE id = ? AND diagnosis_id = ?',
      [outcomeId, id]
    );

    return NextResponse.json(
      { message: 'Beklenen sonuç kriteri silindi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expected outcome:', error);
    return NextResponse.json(
      { error: 'Beklenen sonuç kriteri silinemedi' },
      { status: 500 }
    );
  }
}

