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

    // Get all seeder files (both .sql and .json)
    const sqlFiles = fs.readdirSync(seedersDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    const jsonFiles = fs.readdirSync(seedersDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    // Run SQL seeders first
    for (const file of sqlFiles) {
      console.log(`→ Running ${file}...`);
      const sql = fs.readFileSync(path.join(seedersDir, file), 'utf8');
      await connection.query(sql);
      console.log(`✓ Completed ${file}`);
    }

    // Run JSON seeders
    for (const file of jsonFiles) {
      console.log(`→ Running ${file}...`);
      const jsonData = JSON.parse(fs.readFileSync(path.join(seedersDir, file), 'utf8'));
      await seedFromJson(connection, jsonData);
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

async function seedFromJson(connection, jsonData) {
  // Get category ID
  const [categories] = await connection.query(
    'SELECT id FROM anamnesis_categories WHERE name = ? LIMIT 1',
    [jsonData.category_name]
  );

  if (categories.length === 0) {
    throw new Error(`Category "${jsonData.category_name}" not found`);
  }

  const categoryId = categories[0].id;

  // Insert questions
  for (const question of jsonData.questions) {
    const optionsJson = question.options ? JSON.stringify(question.options) : null;
    const criteriaJson = question.criteria ? JSON.stringify(question.criteria) : null;

    await connection.query(
      `INSERT INTO anamnesis_questions 
       (category_id, question_text, question_type, is_required, order_index, options_json, criteria_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         question_text = VALUES(question_text),
         question_type = VALUES(question_type),
         is_required = VALUES(is_required),
         order_index = VALUES(order_index),
         options_json = VALUES(options_json),
         criteria_json = VALUES(criteria_json)`,
      [
        categoryId,
        question.question_text,
        question.question_type,
        question.is_required,
        question.order_index,
        optionsJson,
        criteriaJson
      ]
    );
  }
}

runSeeders();
