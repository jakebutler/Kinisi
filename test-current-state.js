#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Analyzing current test state...');

try {
    // Get a quick test summary
    console.log('\n📊 Running Jest test summary...');
    const output = execSync('npx jest --passWithNoTests --silent', {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
    });

    // Parse the output for key metrics
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Test Suites:') && line.includes('Tests:'));

    if (summaryLine) {
        console.log('📈 Current Test Status:', summaryLine.trim());
    } else {
        console.log('📈 Full test output:');
        console.log(output);
    }

} catch (error) {
    // Jest returns non-zero when tests fail, but we still want the output
    console.log('📈 Test Results (including failures):');
    const output = error.stdout || error.message;
    console.log(output);

    // Try to extract summary
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Test Suites:') && line.includes('Tests:'));

    if (summaryLine) {
        console.log('\n📊 Summary:', summaryLine.trim());

        // Extract numbers
        const totalMatch = summaryLine.match(/(\d+)\s+total/);
        const passedMatch = summaryLine.match(/(\d+)\s+passed/);
        const failedMatch = summaryLine.match(/(\d+)\s+failed/);

        if (totalMatch && passedMatch && failedMatch) {
            const total = parseInt(totalMatch[1]);
            const passed = parseInt(passedMatch[1]);
            const failed = parseInt(failedMatch[1]);
            const successRate = ((passed / total) * 100).toFixed(1);

            console.log(`\n🎯 Test Analysis:`);
            console.log(`   Total Tests: ${total}`);
            console.log(`   Passed: ${passed} (${successRate}%)`);
            console.log(`   Failed: ${failed} (${(100 - successRate).toFixed(1)}%)`);

            if (failed > 0) {
                console.log(`\n🔧 Need to fix ${failed} failing tests to achieve 100% success rate`);
            }
        }
    }
}