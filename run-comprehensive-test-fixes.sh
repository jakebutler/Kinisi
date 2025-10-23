#!/bin/bash

# Comprehensive Test Fixes Execution Script
# Test Automator Solution for resolving all 6 remaining test failures

set -e

echo "🚀 Starting Comprehensive Test Fix Execution"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must be run from project root directory"
    exit 1
fi

print_status "Step 1: Validating test infrastructure files..."

# Check if all our infrastructure files exist
INFRASTRUCTURE_FILES=(
    "__tests__/utils/unifiedMockManager.ts"
    "__tests__/utils/testHelpers.ts"
    "__tests__/utils/testDataFactories.ts"
    "__tests__/integration/test-fixes-comprehensive.test.tsx"
    "jest.config.enhanced.cjs"
    "__tests__/setup/jestTestInfrastructure.js"
    "__tests__/setup/globalTestSetup.js"
)

for file in "${INFRASTRUCTURE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
        exit 1
    fi
done

print_status "Step 2: Installing dependencies..."

# Ensure dependencies are installed
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

print_status "Step 3: Building TypeScript for testing..."

# Compile TypeScript to ensure no compilation errors
npx tsc --noEmit --project tsconfig.json || {
    print_error "TypeScript compilation failed"
    exit 1
}

print_success "✓ TypeScript compilation successful"

print_status "Step 4: Running comprehensive test validation..."

# First, run just our comprehensive fixes to validate they work
print_status "Running comprehensive test fixes..."

if npx jest __tests__/integration/test-fixes-comprehensive.test.tsx --verbose --detectOpenHandles; then
    print_success "✓ Comprehensive test fixes pass"
else
    print_error "✗ Comprehensive test fixes failed"
    exit 1
fi

print_status "Step 5: Running full test suite with enhanced configuration..."

# Backup original Jest config if it exists
if [ -f "jest.config.cjs" ]; then
    cp jest.config.cjs jest.config.cjs.backup
    print_status "✓ Backed up original jest.config.cjs"
fi

# Use enhanced configuration
cp jest.config.enhanced.cjs jest.config.cjs

# Run full test suite with detailed output
print_status "Running full test suite..."

TEST_OUTPUT=$(npx jest --verbose --detectOpenHandles --no-cache 2>&1)
TEST_EXIT_CODE=$?

echo "$TEST_OUTPUT"

# Analyze test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "🎉 ALL TESTS PASSING! 100% SUCCESS RATE ACHIEVED!"

    # Count tests
    TOTAL_TESTS=$(echo "$TEST_OUTPUT" | grep -o "Tests:.*" | head -1 | grep -o "[0-9]\+ passed" | grep -o "[0-9]\+" || echo "Unknown")
    print_success "Total tests passing: $TOTAL_TESTS"

elif [ $TEST_EXIT_CODE -eq 1 ]; then
    # Analyze failure patterns
    FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -c "FAIL:" || echo "0")
    PASSED_TESTS=$(echo "$TEST_OUTPUT" | grep -c "PASS:" || echo "0")
    TOTAL_TESTS=$((FAILED_TESTS + PASSED_TESTS))
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

    print_error "Test failures detected:"
    print_error "  Failed: $FAILED_TESTS"
    print_error "  Passed: $PASSED_TESTS"
    print_error "  Success Rate: ${SUCCESS_RATE}%"

    if [ $FAILED_TESTS -le 6 ]; then
        print_warning "Within target range - continuing with analysis"
    else
        print_error "Too many failures - aborting"
        exit 1
    fi
else
    print_error "Jest execution failed with exit code: $TEST_EXIT_CODE"
    exit 1
fi

print_status "Step 6: Analyzing test failure patterns..."

# Extract specific failure information
echo "$TEST_OUTPUT" | grep -A 5 -B 5 "FAIL:" > test-failures.log

if [ -s "test-failures.log" ]; then
    print_warning "Test failures logged to test-failures.log"

    # Categorize failures
    MOCK_FAILURES=$(grep -c "mock\|Mock" test-failures.log || echo "0")
    ASYNC_FAILURES=$(grep -c "async\|timeout\|Promise" test-failures.log || echo "0")
    CONTEXT_FAILURES=$(grep -c "context\|provider\|hook" test-failures.log || echo "0")
    DATA_FAILURES=$(grep -c "data\|undefined\|null" test-failures.log || echo "0")

    print_status "Failure categorization:"
    echo "  Mock-related: $MOCK_FAILURES"
    echo "  Async-related: $ASYNC_FAILURES"
    echo "  Context-related: $CONTEXT_FAILURES"
    echo "  Data-related: $DATA_FAILURES"
fi

print_status "Step 7: Generating test report..."

# Create comprehensive test report
cat > test-fixes-report.md << EOF
# Comprehensive Test Fixes Report

Generated: $(date)

## Test Results Summary
- Exit Code: $TEST_EXIT_CODE
- Total Tests: $TOTAL_TESTS
- Passed: $PASSED_TESTS
- Failed: $FAILED_TESTS
- Success Rate: ${SUCCESS_RATE}%

## Infrastructure Validation
- All infrastructure files: ✓ Present
- TypeScript compilation: ✓ Successful
- Comprehensive fixes: ✓ Passing

## Failure Analysis
EOF

if [ -s "test-failures.log" ]; then
    echo "### Categorized Failures" >> test-fixes-report.md
    echo "- Mock-related: $MOCK_FAILURES" >> test-fixes-report.md
    echo "- Async-related: $ASYNC_FAILURES" >> test-fixes-report.md
    echo "- Context-related: $CONTEXT_FAILURES" >> test-fixes-report.md
    echo "- Data-related: $DATA_FAILURES" >> test-fixes-report.md
    echo "" >> test-fixes-report.md
    echo "### Detailed Failures" >> test-fixes-report.md
    echo '```' >> test-fixes-report.md
    cat test-failures.log >> test-fixes-report.md
    echo '```' >> test-fixes-report.md
else
    echo "No failures detected - all tests passing!" >> test-fixes-report.md
fi

print_success "✓ Test report generated: test-fixes-report.md"

print_status "Step 8: Cleanup and final validation..."

# Restore original Jest config if backup exists
if [ -f "jest.config.cjs.backup" ]; then
    mv jest.config.cjs.backup jest.config.cjs
    print_status "✓ Restored original jest.config.cjs"
fi

# Final validation
print_status "Running final validation tests..."

if npx jest __tests__/integration/test-fixes-comprehensive.test.tsx --silent; then
    print_success "✓ Final validation passed"
else
    print_warning "⚠️ Final validation had issues"
fi

print_success "🎉 Comprehensive test fix execution completed!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review test-fixes-report.md for detailed results"
echo "2. If failures remain, examine test-failures.log"
echo "3. Apply remaining targeted fixes as needed"
echo "4. Run script again to validate improvements"

# Exit with appropriate code
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "🎯 100% TEST SUCCESS ACHIEVED!"
    exit 0
else
    print_warning "⚠️ Some tests still failing - review reports"
    exit 1
fi