const { execSync } = require('child_process');

try {
  console.log('🔍 Running Jest to check current test status...');

  // Run jest with basic output
  const output = execSync('npx jest --passWithNoTests --verbose', {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 60000
  });

  console.log(output);
} catch (error) {
  // Jest returns non-zero exit code when tests fail, but we still want the output
  console.log('Test output (including failures):');
  console.log(error.stdout || error.message);

  if (error.stderr) {
    console.log('\nStderr:');
    console.log(error.stderr);
  }
}