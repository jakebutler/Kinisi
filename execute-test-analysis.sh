#!/bin/bash

# Execute comprehensive test analysis for React context provider failures
set -e

echo "🔍 REACT CONTEXT PROVIDER TEST FAILURE ANALYSIS"
echo "==============================================="

# Clean cache to ensure fresh start
echo "🧹 Cleaning Jest cache..."
npx jest --clearCache

# Run the comprehensive analysis test
echo "📊 Running comprehensive mock analysis..."
npx jest __tests__/integration/comprehensive-mock-analysis.test.tsx \
  --verbose \
  --no-cache \
  --detectOpenHandles \
  --forceExit

echo ""
echo "🎯 ANALYSIS COMPLETE"