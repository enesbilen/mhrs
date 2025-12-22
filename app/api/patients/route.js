import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/patients - List all patients (excluding archived by default)
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = `
      SELECT p.*, u.username as created_by_name
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.id
    `;

    if (!includeArchived) {
      query += ' WHERE p.archived = FALSE';
    }

    query += ' ORDER BY p.created_at DESC';

    const patients = await db.query(query);

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Hastalar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create new patient
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      file_no,
      bed_no,
      first_name,
      last_name,
      birth_date,
      gender,
      medical_diagnosis,
    } = body;

    // Validate input
    if (
      !file_no ||
      !first_name ||
      !last_name ||
      !birth_date ||
      !gender
    ) {
      return NextResponse.json(
        { error: 'Dosya no, ad, soyad, doğum tarihi ve cinsiyet gerekli' },
        { status: 400 }
      );
    }

    if (!['Erkek', 'Kız'].includes(gender)) {
      return NextResponse.json({ error: 'Geçersiz cinsiyet' }, { status: 400 });
    }

    // Check if file_no already exists
    const existing = await db.query(
      'SELECT id FROM patients WHERE file_no = ?',
      [file_no]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu dosya numarası zaten kullanımda' },
        { status: 400 }
      );
    }

    // Insert patient
    const result = await db.execute(
      'INSERT INTO patients (file_no, bed_no, first_name, last_name, birth_date, gender, medical_diagnosis, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        file_no,
        bed_no,
        first_name,
        last_name,
        birth_date,
        gender,
        medical_diagnosis,
        user.id,
      ]
    );

    return NextResponse.json(
      { message: 'Hasta kaydedildi', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Hasta kaydedilemedi' },
      { status: 500 }
    );
  }
}
