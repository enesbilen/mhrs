const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSeeders() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'mhrs',
    multipleStatements: true,
  });

  try {
    // Read seeder files
    const seedersDir = path.join(__dirname, '../seeders');
    if (!fs.existsSync(seedersDir)) {
      console.log('No seeders directory found. Creating...');
      fs.mkdirSync(seedersDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(seedersDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`→ Running ${file}...`);
      const sql = fs.readFileSync(path.join(seedersDir, file), 'utf8');
      await connection.query(sql);
      console.log(`✓ Completed ${file}`);
    }

    console.log('\n✓ All seeders completed!');
  } catch (error) {
    console.error('Seeder error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeeders();
