const fs = require('fs');
const path = require('path');

console.log('=== Finding Survey Type Definitions ===\n');

function findFiles(dir, pattern, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];

  const results = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...findFiles(fullPath, pattern, maxDepth, currentDepth + 1));
      } else if (pattern.test(item)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore errors (permission denied, etc.)
  }

  return results;
}

// Find survey-related files
const surveyFiles = findFiles(__dirname, /survey/i, 4);
console.log('Survey-related files:');
surveyFiles.forEach(file => console.log('  ', file));

// Find type definition files
const typeFiles = findFiles(__dirname, /types?\.ts$/i, 4);
console.log('\nType definition files:');
typeFiles.forEach(file => console.log('  ', file));

// Check specific directories
const dirsToCheck = [
  'types',
  'src/types',
  'lib/types',
  'components/survey',
  'utils/survey'
];

console.log('\nChecking specific directories:');
dirsToCheck.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${dir} exists`);
    try {
      const items = fs.readdirSync(fullPath);
      items.forEach(item => console.log(`    - ${item}`));
    } catch (err) {
      console.log(`  (cannot read contents)`);
    }
  } else {
    console.log(`✗ ${dir} does not exist`);
  }
});

// Look for SurveyQuestion interface or type definition
console.log('\n=== Searching for SurveyQuestion type ===');
const allTsFiles = findFiles(__dirname, /\.ts$/i, 3);

for (const file of allTsFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('SurveyQuestion') || content.includes('SurveyResponseData')) {
      console.log(`Found survey types in: ${file}`);

      // Extract type definitions
      const interfaceMatches = content.match(/export\s+(interface|type)\s+(SurveyQuestion|SurveyResponseData)[^}]*}/gs);
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          console.log('  ', match.substring(0, 100) + '...');
        });
      }
    }
  } catch (err) {
    // Skip files we can't read
  }
}