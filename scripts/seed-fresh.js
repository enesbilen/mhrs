const mysql = require('mysql2/promise');

async function seedFresh() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'mhrs',
    multipleStatements: true,
  });

  try {
    console.log('🗑️  Clearing all data from tables...\n');

    // Delete in correct order (respecting foreign keys)
    const tables = [
      'patient_diagnosis_suggestions',
      'diagnosis_criteria',
      'anamnesis_answers',
      'anamnesis_forms',
      'anamnesis_questions',
      'anamnesis_categories',
      'nurse_diagnoses',
      'patients',
      'users',
    ];

    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
      await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      console.log(`  ✓ Cleared: ${table}`);
    }

    console.log('\n✓ All tables cleared!\n');
    console.log('📦 Running seeders...\n');

    // Run seeders
    const fs = require('fs');
    const path = require('path');
    const seedersDir = path.join(__dirname, '../seeders');
    const files = fs.readdirSync(seedersDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`  → Running ${file}...`);
      const sql = fs.readFileSync(path.join(seedersDir, file), 'utf8');
      await connection.query(sql);
      console.log(`  ✓ Completed ${file}`);
    }

    console.log('\n✨ Seed fresh completed!');
  } catch (error) {
    console.error('Seed fresh error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedFresh();
