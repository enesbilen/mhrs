import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/diagnoses/[id] - Get single diagnosis with criteria
export async function GET(request, { params }) {
  try {
    
    const { id } = await params;
const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnoses = await db.query(
      'SELECT * FROM nurse_diagnoses WHERE id = ?',
      [id]
    );

    if (diagnoses.length === 0) {
      return NextResponse.json({ error: 'Tanı bulunamadı' }, { status: 404 });
    }

    // Get criteria (linked questions)
    const criteria = await db.query(
      `SELECT dc.*, q.question_text
       FROM diagnosis_criteria dc
       JOIN anamnesis_questions q ON dc.question_id = q.id
       WHERE dc.diagnosis_id = ?
       ORDER BY dc.id`,
      [id]
    );

    const parsedCriteria = criteria.map((c) => ({
      ...c,
      accepted_values: JSON.parse(c.accepted_values_json),
    }));

    // Get defining characteristics
    const definingCharacteristics = await db.query(
      `SELECT id, characteristic_text, order_index
       FROM nurse_diagnosis_defining_characteristics
       WHERE diagnosis_id = ?
       ORDER BY order_index ASC, id ASC`,
      [id]
    );

    return NextResponse.json({
      ...diagnoses[0],
      criteria: parsedCriteria,
      defining_characteristics: definingCharacteristics,
    });
  } catch (error) {
    console.error('Error fetching diagnosis:', error);
    return NextResponse.json({ error: 'Tanı getirilemedi' }, { status: 500 });
  }
}

// PUT /api/diagnoses/[id] - Update diagnosis
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, min_criteria_count, defining_characteristics } = body;

    if (!name || !min_criteria_count) {
      return NextResponse.json(
        { error: 'Tanı adı ve minimum kriter sayısı gerekli' },
        { status: 400 }
      );
    }

    // Check if diagnosis exists
    const existing = await db.query(
      'SELECT id FROM nurse_diagnoses WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Tanı bulunamadı' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current diagnosis)
    const duplicate = await db.query(
      'SELECT id FROM nurse_diagnoses WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir tanı zaten mevcut' },
        { status: 409 }
      );
    }

    // Use transaction to update diagnosis and defining characteristics
    await db.transaction(async (connection) => {
      // Update diagnosis
      await connection.execute(
        'UPDATE nurse_diagnoses SET name = ?, description = ?, min_criteria_count = ? WHERE id = ?',
        [name, description || null, parseInt(min_criteria_count), id]
      );

      // Delete existing defining characteristics
      await connection.execute(
        'DELETE FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ?',
        [id]
      );

      // Insert new defining characteristics if provided
      if (defining_characteristics && Array.isArray(defining_characteristics) && defining_characteristics.length > 0) {
        for (let i = 0; i < defining_characteristics.length; i++) {
          const characteristic = defining_characteristics[i];
          if (characteristic && characteristic.trim()) {
            await connection.execute(
              'INSERT INTO nurse_diagnosis_defining_characteristics (diagnosis_id, characteristic_text, order_index) VALUES (?, ?, ?)',
              [id, characteristic.trim(), i + 1]
            );
          }
        }
      }
    });

    return NextResponse.json({ message: 'Tanı güncellendi' });
  } catch (error) {
    console.error('Error updating diagnosis:', error);

    // Handle MySQL duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir tanı zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Tanı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnoses/[id] - Delete diagnosis
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete related data first (CASCADE should handle this, but let's be explicit)
    await db.execute('DELETE FROM diagnosis_criteria WHERE diagnosis_id = ?', [
      id,
    ]);
    await db.execute('DELETE FROM nurse_diagnosis_defining_characteristics WHERE diagnosis_id = ?', [
      id,
    ]);

    await db.execute('DELETE FROM nurse_diagnoses WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Tanı silindi' });
  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    return NextResponse.json({ error: 'Tanı silinemedi' }, { status: 500 });
  }
}
