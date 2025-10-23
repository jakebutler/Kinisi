#!/bin/bash

# Make scripts executable
chmod +x analyze-tests.sh
chmod +x categorize-failures.js

echo "🚀 Starting comprehensive test failure analysis..."
echo "================================================="

# Step 1: Run tests and capture output
echo "📊 Step 1: Running tests to capture failures..."
./analyze-tests.sh

# Step 2: Categorize the failures
echo ""
echo "🔍 Step 2: Categorizing test failures by root cause..."
node categorize-failures.js

echo ""
echo "✅ Test analysis complete!"
echo ""
echo "📁 Generated files:"
echo "  - test-failures.log: Raw test output"
echo "  - test-failure-categorization.json: Detailed categorization"
echo ""
echo "🎯 Next steps: Review the categorization to prioritize fixes"