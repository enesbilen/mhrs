import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// DELETE /api/diagnoses/[id]/criteria/[criterionId] - Remove criterion
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const { criterionId } = await params;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute('DELETE FROM diagnosis_criteria WHERE id = ?', [
      criterionId,
    ]);

    return NextResponse.json({ message: 'Kriter kaldırıldı' });
  } catch (error) {
    console.error('Error removing criterion:', error);
    return NextResponse.json(
      { error: 'Kriter kaldırılamadı' },
      { status: 500 }
    );
  }
}
