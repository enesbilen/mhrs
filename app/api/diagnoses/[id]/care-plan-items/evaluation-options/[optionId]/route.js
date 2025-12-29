import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// PUT /api/diagnoses/[id]/care-plan-items/evaluation-options/[optionId]
export async function PUT(request, { params }) {
  try {
    const { id, optionId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { option_text, option_value } = body;

    if (!option_text || !option_text.trim() || !option_value || !option_value.trim()) {
      return NextResponse.json(
        { error: 'Seçenek metni ve değeri gerekli' },
        { status: 400 }
      );
    }

    // Check if option_text already exists for another option in this diagnosis
    const existingText = await db.query(
      'SELECT id FROM diagnosis_evaluation_options WHERE diagnosis_id = ? AND option_text = ? AND id != ?',
      [id, option_text.trim(), optionId]
    );

    if (existingText.length > 0) {
      return NextResponse.json(
        { error: 'Bu seçenek metni zaten başka bir seçenekte kullanılıyor' },
        { status: 400 }
      );
    }

    // Check if option_value already exists for another option in this diagnosis
    const existingValue = await db.query(
      'SELECT id FROM diagnosis_evaluation_options WHERE diagnosis_id = ? AND option_value = ? AND id != ?',
      [id, option_value.trim(), optionId]
    );

    if (existingValue.length > 0) {
      return NextResponse.json(
        { error: 'Bu değer zaten başka bir seçenekte kullanılıyor' },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE diagnosis_evaluation_options
       SET option_text = ?, option_value = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND diagnosis_id = ?`,
      [option_text.trim(), option_value.trim(), optionId, id]
    );

    return NextResponse.json(
      { message: 'Değerlendirme seçeneği güncellendi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating evaluation option:', error);
    return NextResponse.json(
      { error: 'Değerlendirme seçeneği güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[id]/care-plan-items/evaluation-options/[optionId]
export async function DELETE(request, { params }) {
  try {
    const { id, optionId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute(
      'DELETE FROM diagnosis_evaluation_options WHERE id = ? AND diagnosis_id = ?',
      [optionId, id]
    );

    return NextResponse.json(
      { message: 'Değerlendirme seçeneği silindi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting evaluation option:', error);
    return NextResponse.json(
      { error: 'Değerlendirme seçeneği silinemedi' },
      { status: 500 }
    );
  }
}

