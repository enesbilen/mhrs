import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// POST /api/diagnoses/[id]/care-plan-items/interventions
export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if duplicate exists (same diagnosis cannot have duplicate intervention_text)
    const existing = await db.query(
      'SELECT id FROM diagnosis_interventions WHERE diagnosis_id = ? AND intervention_text = ?',
      [id, intervention_text.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu girişim zaten mevcut' },
        { status: 400 }
      );
    }

    // Get max order_index
    const maxOrder = await db.query(
      'SELECT MAX(order_index) as max_order FROM diagnosis_interventions WHERE diagnosis_id = ?',
      [id]
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;

    const result = await db.execute(
      `INSERT INTO diagnosis_interventions (diagnosis_id, intervention_text, order_index)
       VALUES (?, ?, ?)`,
      [id, intervention_text.trim(), nextOrder]
    );

    return NextResponse.json(
      { message: 'Girişim eklendi', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { error: 'Girişim eklenemedi' },
      { status: 500 }
    );
  }
}

