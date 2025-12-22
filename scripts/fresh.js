const { execSync } = require('child_process');

console.log('🔄 Running fresh migration (drop + recreate)...\n');

try {
  // Step 1: Reset (drop database)
  console.log('Step 1/2: Resetting database...');
  execSync('npm run db:reset', { stdio: 'inherit' });

  console.log('\n');

  // Step 2: Migrate (create database and tables)
  console.log('Step 2/2: Running migrations...');
  execSync('npm run db:migrate', { stdio: 'inherit' });

  console.log('\n✨ Fresh migration completed!');
} catch (error) {
  console.error('\n❌ Fresh migration failed:', error.message);
  process.exit(1);
}
