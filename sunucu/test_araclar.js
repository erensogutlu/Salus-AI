const path = require('path');

console.log('Testing Salus AI local modules load status...');

try {
  // Test requiring local configurations and modules
  const knexfile = require('./knexfile');
  console.log('✓ knexfile.js parsed successfully');

  const cacheYonetici = require('./araclar/cacheYonetici');
  console.log('✓ cacheYonetici.js loaded successfully');

  const errorYonetici = require('./araclar/hataYonetici');
  console.log('✓ hataYonetici.js loaded successfully');

  const guvenlikAraci = require('./araclar/guvenlikAraci');
  console.log('✓ guvenlikAraci.js loaded successfully');

  console.log('All local module sanity checks passed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Fatal error during sanity checks:', error);
  process.exit(1);
}
