#!/usr/bin/env node

/**
 * Script to analyze Jest test failures and categorize them by root cause
 */

const fs = require('fs');
const path = require('path');

// Read the test log file
const testLogPath = path.join(__dirname, 'test-failures.log');
let testLog = '';

if (fs.existsSync(testLogPath)) {
    testLog = fs.readFileSync(testLogPath, 'utf8');
} else {
    console.error('❌ test-failures.log not found. Please run tests first.');
    process.exit(1);
}

// Categories for test failures
const categories = {
    'Import/Module Resolution': {
        patterns: [
            /Cannot find module/i,
            /Module not found/i,
            /import.*from.*['"]\.\.\/\.\./,
            /resolve module/i,
            /Unexpected token/i,
            /SyntaxError.*import/i
        ],
        tests: [],
        description: 'Issues with module imports, exports, or path resolution'
    },
    'Mock System Conflicts': {
        patterns: [
            /Cannot deconstruct.*data/i,
            /Cannot destructure property/i,
            /TypeError.*onAuthStateChange/i,
            /mock.*not.*function/i,
            /jest\.mock.*not.*found/i,
            /supabase.*undefined/i
        ],
        tests: [],
        description: 'Conflicts between different mock systems or mock structure issues'
    },
    'Mock Validation Tests': {
        patterns: [
            /test.*mock/i,
            /mock.*test/i,
            /validation.*mock/i,
            /persistence.*mock/i,
            /react.*specialist.*test/i
        ],
        tests: [],
        description: 'Tests that appear to be testing the mock system itself rather than real functionality'
    },
    'Legacy Test Code': {
        patterns: [
            /component.*unmount/i,
            /enzyme/i,
            /shallow.*render/i,
            /react.*testing.*library.*old/i,
            /deprecated/i
        ],
        tests: [],
        description: 'Tests using outdated patterns or legacy React testing approaches'
    },
    'Missing Dependencies': {
        patterns: [
            /is not defined/i,
            /ReferenceError.*\w+ is not defined/i,
            /Cannot read property.*undefined/i,
            /undefined.*is not a function/i
        ],
        tests: [],
        description: 'Missing or improperly mocked dependencies'
    },
    'Configuration Issues': {
        patterns: [
            /transform error/i,
            /babel.*error/i,
            /typescript.*error/i,
            /ts-jest.*error/i,
            /setupFilesAfterEnv/i
        ],
        tests: [],
        description: 'Jest configuration, babel, or TypeScript compilation issues'
    },
    'Async/Timing Issues': {
        patterns: [
            /timeout/i,
            /async.*await/i,
            /promise.*rejected/i,
            /act.*warning/i,
            /update.*not.*wrapped/i
        ],
        tests: [],
        description: 'Async test timing, promises, or React act() warnings'
    }
};

// Parse test failures
const lines = testLog.split('\n');
let currentTest = null;
let currentError = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect test failure start
    if (line.includes('FAIL') && line.includes('.test.') || line.includes('.spec.')) {
        const testMatch = line.match(/FAIL\s+(.*?\.(test|spec)\.[jt]sx?)/);
        if (testMatch) {
            currentTest = testMatch[1];
            currentError = '';
        }
    }

    // Collect error details
    if (currentTest && (line.includes('Error:') || line.includes('TypeError:') || line.includes('Cannot'))) {
        currentError = line;
        // Also collect next few lines for context
        let j = i + 1;
        while (j < lines.length && j < i + 5 && !lines[j].includes('FAIL') && !lines[j].includes('PASS')) {
            currentError += '\n' + lines[j];
            j++;
        }

        // Categorize the error
        let categorized = false;
        for (const [categoryName, categoryData] of Object.entries(categories)) {
            for (const pattern of categoryData.patterns) {
                if (pattern.test(currentError)) {
                    categoryData.tests.push({
                        test: currentTest,
                        error: currentError,
                        pattern: pattern.toString()
                    });
                    categorized = true;
                    break;
                }
            }
            if (categorized) break;
        }

        // If uncategorized, add to "Other"
        if (!categorized) {
            if (!categories['Other Issues']) {
                categories['Other Issues'] = {
                    patterns: [],
                    tests: [],
                    description: 'Miscellaneous issues that don\'t fit other categories'
                };
            }
            categories['Other Issues'].tests.push({
                test: currentTest,
                error: currentError,
                pattern: 'Uncategorized'
            });
        }

        currentTest = null;
        currentError = null;
    }
}

// Generate report
console.log('🔍 Test Failure Analysis Report');
console.log('================================\n');

let totalFailures = 0;
for (const [categoryName, categoryData] of Object.entries(categories)) {
    totalFailures += categoryData.tests.length;
}

console.log(`📊 Total Failed Tests Analyzed: ${totalFailures}\n`);

for (const [categoryName, categoryData] of Object.entries(categories)) {
    const count = categoryData.tests.length;
    const percentage = totalFailures > 0 ? ((count / totalFailures) * 100).toFixed(1) : 0;

    if (count > 0) {
        console.log(`🔸 ${categoryName}: ${count} tests (${percentage}%)`);
        console.log(`   ${categoryData.description}`);
        console.log('   Sample failures:');

        // Show first 3 examples
        categoryData.tests.slice(0, 3).forEach((test, index) => {
            console.log(`     ${index + 1}. ${test.test}`);
            const errorLine = test.error.split('\n')[0];
            console.log(`        ${errorLine}`);
        });

        if (categoryData.tests.length > 3) {
            console.log(`     ... and ${categoryData.tests.length - 3} more`);
        }

        console.log('');
    }
}

// Save detailed report
const reportData = {
    analysisDate: new Date().toISOString(),
    totalFailures,
    categories: Object.entries(categories).reduce((acc, [name, data]) => {
        acc[name] = {
            count: data.tests.length,
            description: data.description,
            tests: data.tests
        };
        return acc;
    }, {})
};

fs.writeFileSync(
    path.join(__dirname, 'test-failure-categorization.json'),
    JSON.stringify(reportData, null, 2)
);

console.log('📁 Detailed categorization saved to: test-failure-categorization.json');

// Generate fix strategy recommendations
console.log('\n🎯 Recommended Fix Strategy:');
console.log('============================');

const highPriorityCategories = Object.entries(categories)
    .filter(([_, data]) => data.tests.length > 0)
    .sort((a, b) => b[1].tests.length - a[1].tests.length);

highPriorityCategories.forEach(([categoryName, categoryData], index) => {
    console.log(`\n${index + 1}. ${categoryName} (${categoryData.tests.length} tests)`);

    switch (categoryName) {
        case 'Import/Module Resolution':
            console.log('   → Fix import paths, especially Next.js route groups');
            console.log('   → Update module exports and check TypeScript paths');
            console.log('   → Verify Jest moduleNameMapper configuration');
            break;
        case 'Mock System Conflicts':
            console.log('   → Standardize on single Supabase mock system');
            console.log('   → Remove conflicting mock implementations');
            console.log('   → Ensure consistent mock structure across all tests');
            break;
        case 'Mock Validation Tests':
            console.log('   → Remove or relocate tests that only validate mocks');
            console.log('   → Focus tests on real application functionality');
            console.log('   → Keep only essential mock infrastructure tests');
            break;
        case 'Legacy Test Code':
            console.log('   → Update to modern React Testing Library patterns');
            console.log('   → Replace deprecated testing approaches');
            console.log('   → Ensure compatibility with React 18+');
            break;
        case 'Missing Dependencies':
            console.log('   → Add proper mocks for all external dependencies');
            console.log('   → Check for undefined variables and functions');
            console.log('   → Ensure proper setup in jest.setup.js');
            break;
        case 'Configuration Issues':
            console.log('   → Review Jest configuration and transforms');
            console.log('   → Check TypeScript compilation settings');
            console.log('   → Verify test environment setup');
            break;
        case 'Async/Timing Issues':
            console.log('   → Add proper async/await patterns');
            console.log('   → Use waitFor and act() from RTL');
            console.log('   → Fix promise handling and timeouts');
            break;
        default:
            console.log('   → Review individual test cases for specific issues');
            console.log('   → Consider test relevance and purpose');
            break;
    }
});