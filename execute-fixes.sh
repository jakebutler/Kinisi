#!/bin/bash

echo "🚀 EXECUTING FINAL TEST FIXES"
echo "=============================="

chmod +x apply-fixes-now.js

# Execute the fix
node apply-fixes-now.js

echo ""
echo "🧪 Running tests to verify fixes..."
echo "=================================="

# Clear Jest cache and run tests
npx jest --clearCache
npm test