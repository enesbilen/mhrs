import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/diagnoses/[id]/defining-characteristics - Get defining characteristics for a diagnosis
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const characteristics = await db.query(
      `SELECT id, characteristic_text, order_index
       FROM nurse_diagnosis_defining_characteristics
       WHERE diagnosis_id = ?
       ORDER BY order_index ASC, id ASC`,
      [id]
    );

    return NextResponse.json(characteristics);
  } catch (error) {
    console.error('Error fetching defining characteristics:', error);
    return NextResponse.json(
      { error: 'Tanımlayıcı özellikler getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/diagnoses/[id]/defining-characteristics - Add defining characteristic to diagnosis
export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if diagnosis exists
    const diagnosis = await db.query(
      'SELECT id FROM nurse_diagnoses WHERE id = ?',
      [id]
    );

    if (diagnosis.length === 0) {
      return NextResponse.json(
        { error: 'Tanı bulunamadı' },
        { status: 404 }
      );
    }

    // Get max order_index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const [maxResult] = await db.query(
        'SELECT COALESCE(MAX(order_index), 0) as max_order FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ?',
        [id]
      );
      finalOrderIndex = (maxResult[0]?.max_order || 0) + 1;
    }

    const result = await db.execute(
      'INSERT INTO nurse_diagnosis_defining_characteristics (diagnosis_id, characteristic_text, order_index) VALUES (?, ?, ?)',
      [id, characteristic_text.trim(), finalOrderIndex]
    );

    return NextResponse.json(
      { message: 'Tanımlayıcı özellik eklendi', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding defining characteristic:', error);
    return NextResponse.json(
      { error: 'Tanımlayıcı özellik eklenemedi' },
      { status: 500 }
    );
  }
}

