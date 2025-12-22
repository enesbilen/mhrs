import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';
const db = require('@/lib/db');

// GET /api/admin/users - List all users
export async function GET() {
  try {
    await requireAdmin();

    const users = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Kullanıcılar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validate input
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 });
    }

    // Check if username or email already exists
    const existingUsers = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya email zaten kullanımda' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );

    return NextResponse.json(
      { message: 'Kullanıcı oluşturuldu', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    );
  }
}
