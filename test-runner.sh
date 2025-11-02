#!/bin/bash

echo "Running specific IntakeSurvey test..."
cd /Users/jacobbutler/Documents/GitHub/Kinisi

echo "Testing the original failing test..."
pnpm test __tests__/components/v2/onboarding/IntakeSurvey.test.tsx --verbose

echo "Testing the unit test..."
pnpm test __tests__/components/v2/onboarding/IntakeSurvey.unit.test.tsx --verbose

echo "Testing the integration test..."
pnpm test __tests__/components/survey/SurveyContainer.integration.test.tsx --verbose