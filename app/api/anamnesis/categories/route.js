import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/anamnesis/categories - List all categories
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await db.query(
      `SELECT c.*, s.name as step_name, s.order_index as step_order, s.description as step_description
       FROM anamnesis_categories c
       LEFT JOIN anamnesis_steps s ON c.step_id = s.id
       ORDER BY c.updated_at DESC, c.created_at DESC`
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Kategoriler getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/anamnesis/categories - Create new category
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check for duplicate name
    const existing = await db.query(
      'SELECT id FROM anamnesis_categories WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten mevcut' },
        { status: 409 }
      );
    }

    const result = await db.execute(
      'INSERT INTO anamnesis_categories (name, step_id, order_index) VALUES (?, ?, ?)',
      [name, step_id, order_index || 0]
    );

    return NextResponse.json(
      { message: 'Kategori oluşturuldu', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);

    // Handle MySQL duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten mevcut' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Kategori oluşturulamadı' },
      { status: 500 }
    );
  }
}
