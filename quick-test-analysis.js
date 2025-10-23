const { execSync } = require('child_process');

console.log('🔍 Quick Test Analysis - Understanding Current State\n');

try {
    console.log('📊 Running Jest test summary...');
    const output = execSync('npx jest --passWithNoTests --silent --no-coverage', {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
    });

    console.log('Test output:');
    console.log(output);

    // Try to extract metrics
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Test Suites:') && line.includes('Tests:'));

    if (summaryLine) {
        console.log('\n📈 Summary:', summaryLine.trim());

        const totalMatch = summaryLine.match(/(\d+)\s+total/);
        const passedMatch = summaryLine.match(/(\d+)\s+passed/);
        const failedMatch = summaryLine.match(/(\d+)\s+failed/);

        if (totalMatch && passedMatch && failedMatch) {
            const total = parseInt(totalMatch[1]);
            const passed = parseInt(passedMatch[1]);
            const failed = parseInt(failedMatch[1]);
            const successRate = ((passed / total) * 100).toFixed(1);

            console.log(`\n🎯 Current Status:`);
            console.log(`   Total Tests: ${total}`);
            console.log(`   Passed: ${passed} (${successRate}%)`);
            console.log(`   Failed: ${failed} (${(100 - successRate).toFixed(1)}%)`);

            if (failed > 0) {
                console.log(`\n🔧 Need to fix ${failed} failing tests to achieve 100% success rate`);

                if (successRate >= 85) {
                    console.log('✅ Good progress! Above 85% success rate');
                } else if (successRate >= 70) {
                    console.log('⚠️ Making progress, but more fixes needed');
                } else {
                    console.log('❌ Significant test failures detected - major fixes needed');
                }
            } else {
                console.log('\n🎉 All tests are passing! 100% success rate achieved!');
            }
        }
    }

} catch (error) {
    console.log('📈 Test Results (including failures):');
    const output = error.stdout || error.message;
    console.log(output);

    console.log('\n🔍 Attempting to identify specific failing files...');

    // Try to extract FAIL lines
    const failLines = output.split('\n').filter(line => line.includes('FAIL '));

    if (failLines.length > 0) {
        console.log(`❌ Found ${failLines.length} failing test files:`);
        failLines.slice(0, 10).forEach((line, index) => {
            const fileName = line.replace(/^FAIL\s+/, '').trim();
            console.log(`   ${index + 1}. ${fileName}`);
        });

        if (failLines.length > 10) {
            console.log(`   ... and ${failLines.length - 10} more`);
        }
    }
}

console.log('\n📝 Next step: Run comprehensive test fixer to categorize and fix failures');