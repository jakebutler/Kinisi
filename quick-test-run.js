#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Running quick test analysis...');

try {
  // Run tests with JSON output for better parsing
  const output = execSync('npx jest --json --no-coverage', {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit']
  });

  const results = JSON.parse(output);

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Total Tests: ${results.numTotalTests}`);
  console.log(`Passed: ${results.numPassedTests}`);
  console.log(`Failed: ${results.numFailedTests}`);
  console.log(`Success Rate: ${((results.numPassedTests / results.numTotalTests) * 100).toFixed(1)}%`);

  if (results.numFailedTests > 0) {
    console.log('\n❌ Failed Tests:');
    console.log('================');

    results.testResults.forEach(testFile => {
      if (testFile.numFailingTests > 0) {
        console.log(`\n📁 ${testFile.name}:`);

        testFile.assertionResults.forEach(assertion => {
          if (assertion.status === 'failed') {
            console.log(`  ❌ ${assertion.title}`);
            if (assertion.failureMessages && assertion.failureMessages.length > 0) {
              const firstLine = assertion.failureMessages[0].split('\n')[0];
              console.log(`     ${firstLine}`);
            }
          }
        });
      }
    });
  }

} catch (error) {
  console.error('❌ Error running tests:', error.message);
}