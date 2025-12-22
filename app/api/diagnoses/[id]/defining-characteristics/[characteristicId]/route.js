import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// PUT /api/diagnoses/[id]/defining-characteristics/[characteristicId] - Update defining characteristic
export async function PUT(request, { params }) {
  try {
    const { id, characteristicId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { characteristic_text, order_index } = body;

    if (!characteristic_text || !characteristic_text.trim()) {
      return NextResponse.json(
        { error: 'Tanımlayıcı özellik metni gerekli' },
        { status: 400 }
      );
    }

    // Check if characteristic exists and belongs to this diagnosis
    const existing = await db.query(
      'SELECT id FROM nurse_diagnosis_defining_characteristics WHERE id = ? AND diagnosis_id = ?',
      [characteristicId, id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Tanımlayıcı özellik bulunamadı' },
        { status: 404 }
      );
    }

    await db.execute(
      'UPDATE nurse_diagnosis_defining_characteristics SET characteristic_text = ?, order_index = ? WHERE id = ?',
      [characteristic_text.trim(), order_index || 0, characteristicId]
    );

    return NextResponse.json({ message: 'Tanımlayıcı özellik güncellendi' });
  } catch (error) {
    console.error('Error updating defining characteristic:', error);
    return NextResponse.json(
      { error: 'Tanımlayıcı özellik güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[id]/defining-characteristics/[characteristicId] - Delete defining characteristic
export async function DELETE(request, { params }) {
  try {
    const { id, characteristicId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if characteristic exists and belongs to this diagnosis
    const existing = await db.query(
      'SELECT id FROM nurse_diagnosis_defining_characteristics WHERE id = ? AND diagnosis_id = ?',
      [characteristicId, id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Tanımlayıcı özellik bulunamadı' },
        { status: 404 }
      );
    }

    await db.execute(
      'DELETE FROM nurse_diagnosis_defining_characteristics WHERE id = ?',
      [characteristicId]
    );

    return NextResponse.json({ message: 'Tanımlayıcı özellik silindi' });
  } catch (error) {
    console.error('Error deleting defining characteristic:', error);
    return NextResponse.json(
      { error: 'Tanımlayıcı özellik silinemedi' },
      { status: 500 }
    );
  }
}

