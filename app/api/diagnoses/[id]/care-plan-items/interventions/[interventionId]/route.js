import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// PUT /api/diagnoses/[id]/care-plan-items/interventions/[interventionId]
export async function PUT(request, { params }) {
  try {
    const { id, interventionId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intervention_text } = body;

    if (!intervention_text || !intervention_text.trim()) {
      return NextResponse.json(
        { error: 'Girişim metni gerekli' },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE diagnosis_interventions
       SET intervention_text = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND diagnosis_id = ?`,
      [intervention_text.trim(), interventionId, id]
    );

    return NextResponse.json(
      { message: 'Girişim güncellendi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating intervention:', error);
    return NextResponse.json(
      { error: 'Girişim güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[id]/care-plan-items/interventions/[interventionId]
export async function DELETE(request, { params }) {
  try {
    const { id, interventionId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute(
      'DELETE FROM diagnosis_interventions WHERE id = ? AND diagnosis_id = ?',
      [interventionId, id]
    );

    return NextResponse.json(
      { message: 'Girişim silindi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting intervention:', error);
    return NextResponse.json(
      { error: 'Girişim silinemedi' },
      { status: 500 }
    );
  }
}

