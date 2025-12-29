import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// POST /api/diagnoses/[id]/care-plan-items/evaluation-options
export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if option_text already exists for this diagnosis (same diagnosis cannot have duplicate option_text)
    const existingText = await db.query(
      'SELECT id FROM diagnosis_evaluation_options WHERE diagnosis_id = ? AND option_text = ?',
      [id, option_text.trim()]
    );

    if (existingText.length > 0) {
      return NextResponse.json(
        { error: 'Bu seçenek metni zaten mevcut' },
        { status: 400 }
      );
    }

    // Check if option_value already exists for this diagnosis
    const existingValue = await db.query(
      'SELECT id FROM diagnosis_evaluation_options WHERE diagnosis_id = ? AND option_value = ?',
      [id, option_value.trim()]
    );

    if (existingValue.length > 0) {
      return NextResponse.json(
        { error: 'Bu değer zaten mevcut' },
        { status: 400 }
      );
    }

    // Get max order_index
    const maxOrder = await db.query(
      'SELECT MAX(order_index) as max_order FROM diagnosis_evaluation_options WHERE diagnosis_id = ?',
      [id]
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;

    const result = await db.execute(
      `INSERT INTO diagnosis_evaluation_options (diagnosis_id, option_text, option_value, order_index)
       VALUES (?, ?, ?, ?)`,
      [id, option_text.trim(), option_value.trim(), nextOrder]
    );

    return NextResponse.json(
      { message: 'Değerlendirme seçeneği eklendi', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating evaluation option:', error);
    return NextResponse.json(
      { error: 'Değerlendirme seçeneği eklenemedi' },
      { status: 500 }
    );
  }
}

