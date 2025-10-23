#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running focused test analysis to identify failure patterns...');

// First, let's try to run just a few specific tests to see the actual error messages
try {
    console.log('\n📋 Test 1: Running a single integration test to see detailed errors...');

    // Try to run one specific test with detailed output
    const testOutput = execSync('npx jest __tests__/integration/context-providers-final.test.tsx --verbose --no-coverage', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
    });

    console.log('✅ Test output:');
    console.log(testOutput);

} catch (error) {
    console.log('❌ Test failed with detailed output:');
    console.log(error.stdout || error.message);

    if (error.stderr) {
        console.log('\n🔍 Error details:');
        console.log(error.stderr);
    }
}

// Let's also try to list the test files to understand what we're working with
console.log('\n📁 Discovering test files...');
try {
    const testFiles = execSync('find __tests__ -name "*.test.*" -type f | head -20', {
        encoding: 'utf8'
    });
    console.log(testFiles);
} catch (error) {
    console.log('Could not list test files:', error.message);
}