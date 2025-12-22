const { execSync } = require('child_process');

console.log('🔄 Resetting seeds (fresh + seed)...\n');

try {
  // Run seed fresh (which clears and reseeds)
  execSync('npm run db:seed:fresh', { stdio: 'inherit' });

  console.log('\n✨ Seed reset completed!');
} catch (error) {
  console.error('\n❌ Seed reset failed:', error.message);
  process.exit(1);
}
