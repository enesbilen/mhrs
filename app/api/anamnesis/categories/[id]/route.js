import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/categories/:id - Get single category
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const categories = await db.query(
      `SELECT c.*, s.name as step_name, s.order_index as step_order, s.description as step_description
       FROM anamnesis_categories c
       LEFT JOIN anamnesis_steps s ON c.step_id = s.id
       WHERE c.id = ?`,
      [id]
    );

    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(categories[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Kategori getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT /api/anamnesis/categories/:id - Update category
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, step_id, order_index } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }

    if (!step_id) {
      return NextResponse.json(
        { error: 'Step ID gerekli' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await db.query(
      'SELECT id FROM anamnesis_categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current category)
    const duplicate = await db.query(
      'SELECT id FROM anamnesis_categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten mevcut' },
        { status: 409 }
      );
    }

    await db.execute(
      'UPDATE anamnesis_categories SET name = ?, step_id = ?, order_index = ? WHERE id = ?',
      [name, step_id, order_index !== undefined ? order_index : 0, id]
    );

    return NextResponse.json({
      message: 'Kategori güncellendi',
    });
  } catch (error) {
    console.error('Error updating category:', error);

    // Handle MySQL duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Kategori güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/anamnesis/categories/:id - Delete category
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if category exists
    const existing = await db.query(
      'SELECT id FROM anamnesis_categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    // Check if category is used in any questions
    const usedInQuestions = await db.query(
      'SELECT COUNT(*) as count FROM anamnesis_questions WHERE category_id = ?',
      [id]
    );

    if (usedInQuestions[0].count > 0) {
      return NextResponse.json(
        { error: `Bu kategori ${usedInQuestions[0].count} soruda kullanılıyor. Önce soruların kategorilerini değiştirin.` },
        { status: 409 }
      );
    }

    await db.execute('DELETE FROM anamnesis_categories WHERE id = ?', [id]);

    return NextResponse.json({
      message: 'Kategori silindi',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Kategori silinemedi' },
      { status: 500 }
    );
  }
}
