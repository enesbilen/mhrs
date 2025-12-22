const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runUserSeeder() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'mhrs',
    multipleStatements: true,
  });

  try {
    const seederFile = '001_seed_users.sql';
    const seederPath = path.join(__dirname, '../seeders', seederFile);

    if (!fs.existsSync(seederPath)) {
      console.error(`User seeder file not found: ${seederFile}`);
      process.exit(1);
    }

    console.log(`→ Running ${seederFile}...`);
    const sql = fs.readFileSync(seederPath, 'utf8');
    await connection.query(sql);
    console.log(`✓ Completed ${seederFile}`);

    console.log('\n✓ User seeder completed!');
  } catch (error) {
    console.error('User seeder error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runUserSeeder();
