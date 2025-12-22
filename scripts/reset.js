const mysql = require('mysql2/promise');

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
  });

  try {
    const dbName = process.env.DB_NAME || 'mhrs';

    console.log(`🗑️  Dropping database "${dbName}"...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);

    console.log(`✓ Database "${dbName}" dropped successfully!`);
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetDatabase();
