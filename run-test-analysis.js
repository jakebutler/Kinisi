#!/usr/bin/env node

// Run failing tests with detailed output for analysis
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYZING REACT CONTEXT PROVIDER TEST FAILURES\n');

// Test each file individually to isolate issues
const testFiles = [
  'context-providers-definitive.test.tsx',
  'context-providers-simple.test.tsx',
  'context-providers-working.test.tsx',
  'context-providers.test.tsx'
];

testFiles.forEach((testFile, index) => {
  console.log(`\n${index + 1}. Running ${testFile}...`);
  console.log('='.repeat(60));

  try {
    const output = execSync(`npx jest __tests__/integration/${testFile} --verbose --no-cache`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000
    });

    console.log('✅ SUCCESS:');
    console.log(output);
  } catch (error) {
    console.log('❌ FAILED:');
    console.log(error.stdout || error.message);

    if (error.stderr) {
      console.log('\nSTDERR:');
      console.log(error.stderr);
    }
  }

  console.log('\n' + '='.repeat(80));
});

console.log('\n🎯 ANALYSIS COMPLETE');