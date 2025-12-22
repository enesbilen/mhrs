import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/steps - List all steps
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const steps = await db.query(
      'SELECT * FROM anamnesis_steps ORDER BY order_index ASC, id ASC'
    );

    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching steps:', error);
    return NextResponse.json(
      { error: 'Step\'ler getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/anamnesis/steps - Create new step
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, order_index } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Step adı gerekli' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.query(
      'SELECT id FROM anamnesis_steps WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir step zaten mevcut' },
        { status: 409 }
      );
    }

    const result = await db.execute(
      'INSERT INTO anamnesis_steps (name, description, order_index) VALUES (?, ?, ?)',
      [name, description || null, order_index || 0]
    );

    return NextResponse.json(
      { message: 'Step oluşturuldu', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating step:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir step zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Step oluşturulamadı' },
      { status: 500 }
    );
  }
}

