#!/bin/bash

# Comprehensive test analysis script
echo "🔍 Running comprehensive test analysis..."

# Run tests with detailed output and save to a log file
echo "📊 Running Jest with detailed output..."
npm test -- --verbose --no-cache 2>&1 | tee test-failures.log

echo ""
echo "📈 Test Summary:"
echo "=================="

# Extract total tests
TOTAL_TESTS=$(grep -E "Tests:|Test Suites:" test-failures.log | tail -1 | grep -oE "[0-9]+ total" | grep -oE "[0-9]+")
echo "Total tests: $TOTAL_TESTS"

# Extract passed tests
PASSED_TESTS=$(grep -E "Tests:|Test Suites:" test-failures.log | tail -1 | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
echo "Passed tests: $PASSED_TESTS"

# Extract failed tests
FAILED_TESTS=$(grep -E "Tests:|Test Suites:" test-failures.log | tail -1 | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+")
echo "Failed tests: $FAILED_TESTS"

# Calculate success rate
if [ -n "$TOTAL_TESTS" ] && [ -n "$PASSED_TESTS" ]; then
    SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo "Success rate: ${SUCCESS_RATE}%"
fi

echo ""
echo "❌ Failed Test Details:"
echo "======================="

# Extract failed test file names
grep -E "FAIL.*\.(test|spec)\.(js|jsx|ts|tsx)" test-failures.log | while read line; do
    echo "$line"
done

echo ""
echo "🔍 Top Error Patterns:"
echo "====================="

# Extract common error patterns
grep -E "Error:|TypeError:|Cannot read property|Cannot destructure" test-failures.log | \
    sed 's/.*Error: /Error: /' | \
    sort | uniq -c | sort -nr | head -10

echo ""
echo "📝 Full test report saved to: test-failures.log"