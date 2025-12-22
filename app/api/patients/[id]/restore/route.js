import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// PATCH /api/patients/[id]/restore - Restore archived patient
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if patient exists
    const patients = await db.query('SELECT id, archived FROM patients WHERE id = ?', [
      id,
    ]);

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Hasta bulunamadı' },
        { status: 404 }
      );
    }

    if (!patients[0].archived) {
      return NextResponse.json(
        { error: 'Bu hasta zaten arşivlenmemiş' },
        { status: 400 }
      );
    }

    // Restore patient
    await db.execute(
      'UPDATE patients SET archived = FALSE, archive_reason = NULL, archived_at = NULL WHERE id = ?',
      [id]
    );

    return NextResponse.json({ message: 'Hasta arşivden çıkarıldı' });
  } catch (error) {
    console.error('Error restoring patient:', error);
    return NextResponse.json(
      { error: 'Hasta arşivden çıkarılamadı' },
      { status: 500 }
    );
  }
}

