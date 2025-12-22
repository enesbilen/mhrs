import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';
const db = require('@/lib/db');

// GET /api/admin/users/[id] - Get single user
export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const users = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Kullanıcı getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validate input
    if (!username || !email || !role) {
      return NextResponse.json(
        { error: 'Kullanıcı adı, email ve rol gerekli' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 });
    }

    // Check if username or email already exists for other users
    const existingUsers = await db.query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya email zaten kullanımda' },
        { status: 400 }
      );
    }

    // Update user
    if (password) {
      // If password is provided, update it too
      const passwordHash = await bcrypt.hash(password, 10);
      await db.execute(
        'UPDATE users SET username = ?, email = ?, password_hash = ?, role = ? WHERE id = ?',
        [username, email, passwordHash, role, id]
      );
    } else {
      // Update without password
      await db.execute(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, id]
      );
    }

    return NextResponse.json({ message: 'Kullanıcı güncellendi' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Kullanıcı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if user exists
    const users = await db.query('SELECT id FROM users WHERE id = ?', [
      id,
    ]);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Kullanıcı silinemedi' },
      { status: 500 }
    );
  }
}
