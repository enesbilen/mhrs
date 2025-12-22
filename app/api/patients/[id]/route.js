import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/patients/[id] - Get single patient
export async function GET(request, { params }) {
  try {
    
    const { id } = await params;
const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patients = await db.query(
      `SELECT p.*, u.username as created_by_name
       FROM patients p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Hasta bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(patients[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Hasta getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

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

    // Check if file_no already exists for other patients
    const existing = await db.query(
      'SELECT id FROM patients WHERE file_no = ? AND id != ?',
      [file_no, id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu dosya numarası zaten kullanımda' },
        { status: 400 }
      );
    }

    // Update patient
    await db.execute(
      'UPDATE patients SET file_no = ?, bed_no = ?, first_name = ?, last_name = ?, birth_date = ?, gender = ?, medical_diagnosis = ? WHERE id = ?',
      [
        file_no,
        bed_no,
        first_name,
        last_name,
        birth_date,
        gender,
        medical_diagnosis,
        id,
      ]
    );

    return NextResponse.json({ message: 'Hasta güncellendi' });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Hasta güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Archive patient (soft delete)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { archive_reason } = body || {};

    // Check if patient exists
    const patients = await db.query('SELECT id FROM patients WHERE id = ?', [
      id,
    ]);

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Hasta bulunamadı' },
        { status: 404 }
      );
    }

    // Archive patient
    await db.execute(
      'UPDATE patients SET archived = TRUE, archive_reason = ?, archived_at = NOW() WHERE id = ?',
      [archive_reason || null, id]
    );

    return NextResponse.json({ message: 'Hasta arşivlendi' });
  } catch (error) {
    console.error('Error archiving patient:', error);
    return NextResponse.json(
      { error: 'Hasta arşivlenemedi' },
      { status: 500 }
    );
  }
}
