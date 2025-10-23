#!/bin/bash

chmod +x test-current-state.js
chmod +x comprehensive-test-fixer.js

echo "🔍 Step 1: Analyzing current test state..."
node test-current-state.js

echo ""
echo "🔍 Step 2: Running comprehensive test failure analysis..."
node comprehensive-test-fixer.js