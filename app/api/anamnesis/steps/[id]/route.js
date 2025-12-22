import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/steps/:id - Get single step
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const steps = await db.query(
      'SELECT * FROM anamnesis_steps WHERE id = ?',
      [id]
    );

    if (steps.length === 0) {
      return NextResponse.json(
        { error: 'Step bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(steps[0]);
  } catch (error) {
    console.error('Error fetching step:', error);
    return NextResponse.json(
      { error: 'Step getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT /api/anamnesis/steps/:id - Update step
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, order_index } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Step adı gerekli' },
        { status: 400 }
      );
    }

    // Check if step exists
    const existing = await db.query(
      'SELECT id FROM anamnesis_steps WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Step bulunamadı' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current step)
    const duplicate = await db.query(
      'SELECT id FROM anamnesis_steps WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir step zaten mevcut' },
        { status: 409 }
      );
    }

    await db.execute(
      'UPDATE anamnesis_steps SET name = ?, description = ?, order_index = ? WHERE id = ?',
      [name, description || null, order_index !== undefined ? order_index : 0, id]
    );

    return NextResponse.json({
      message: 'Step güncellendi',
    });
  } catch (error) {
    console.error('Error updating step:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir step zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Step güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/anamnesis/steps/:id - Delete step
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if step exists
    const existing = await db.query(
      'SELECT id FROM anamnesis_steps WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Step bulunamadı' },
        { status: 404 }
      );
    }

    // Check if step is used in any categories
    const usedInCategories = await db.query(
      'SELECT COUNT(*) as count FROM anamnesis_categories WHERE step_id = ?',
      [id]
    );

    if (usedInCategories[0].count > 0) {
      return NextResponse.json(
        { error: `Bu step ${usedInCategories[0].count} kategoride kullanılıyor. Önce kategorilerin step'lerini değiştirin.` },
        { status: 409 }
      );
    }

    await db.execute('DELETE FROM anamnesis_steps WHERE id = ?', [id]);

    return NextResponse.json({
      message: 'Step silindi',
    });
  } catch (error) {
    console.error('Error deleting step:', error);
    return NextResponse.json(
      { error: 'Step silinemedi' },
      { status: 500 }
    );
  }
}

