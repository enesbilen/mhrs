import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/diagnoses - List all diagnoses
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnoses = await db.query(
      'SELECT * FROM nurse_diagnoses ORDER BY name ASC'
    );

    return NextResponse.json(diagnoses);
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    return NextResponse.json(
      { error: 'Tanılar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/diagnoses - Create new diagnosis
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, min_criteria_count, defining_characteristics } = body;

    if (!name || !min_criteria_count) {
      return NextResponse.json(
        { error: 'Tanı adı ve minimum kriter sayısı gerekli' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.query(
      'SELECT id FROM nurse_diagnoses WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir tanı zaten mevcut' },
        { status: 409 }
      );
    }

    // Use transaction to insert diagnosis and defining characteristics
    const result = await db.transaction(async (connection) => {
      // Insert diagnosis
      const [diagnosisResult] = await connection.execute(
        'INSERT INTO nurse_diagnoses (name, description, min_criteria_count) VALUES (?, ?, ?)',
        [name, description || null, parseInt(min_criteria_count)]
      );

      const diagnosisId = diagnosisResult.insertId;

      // Insert defining characteristics if provided
      if (defining_characteristics && Array.isArray(defining_characteristics) && defining_characteristics.length > 0) {
        for (let i = 0; i < defining_characteristics.length; i++) {
          const characteristic = defining_characteristics[i];
          if (characteristic && characteristic.trim()) {
            await connection.execute(
              'INSERT INTO nurse_diagnosis_defining_characteristics (diagnosis_id, characteristic_text, order_index) VALUES (?, ?, ?)',
              [diagnosisId, characteristic.trim(), i + 1]
            );
          }
        }
      }

      return diagnosisId;
    });

    return NextResponse.json(
      { message: 'Tanı oluşturuldu', id: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating diagnosis:', error);

    // Handle MySQL duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir tanı zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Tanı oluşturulamadı' },
      { status: 500 }
    );
  }
}
