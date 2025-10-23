// Debug script to understand IntakeSurvey test failures
// This will help identify the exact issues

const fs = require('fs');
const path = require('path');

console.log('=== IntakeSurvey Test Analysis ===\n');

// Read the test file
const testPath = path.join(__dirname, '__tests__/components/v2/onboarding/IntakeSurvey.test.tsx');
if (fs.existsSync(testPath)) {
  console.log('✓ Test file exists:', testPath);
} else {
  console.log('✗ Test file NOT found:', testPath);
}

// Read the component file
const componentPath = path.join(__dirname, 'components/v2/onboarding/IntakeSurvey.tsx');
if (fs.existsSync(componentPath)) {
  console.log('✓ Component file exists:', componentPath);
} else {
  console.log('✗ Component file NOT found:', componentPath);
}

// Check for survey utilities
const surveyQuestionsPath = path.join(__dirname, 'utils/survey/questionDefinitions.ts');
if (fs.existsSync(surveyQuestionsPath)) {
  console.log('✓ Survey questions file exists:', surveyQuestionsPath);
} else {
  console.log('✗ Survey questions file NOT found:', surveyQuestionsPath);
}

// Check for SurveyContainer component
const surveyContainerPath = path.join(__dirname, 'components/survey/SurveyContainer.tsx');
if (fs.existsSync(surveyContainerPath)) {
  console.log('✓ SurveyContainer component exists:', surveyContainerPath);
} else {
  console.log('✗ SurveyContainer component NOT found:', surveyContainerPath);
}

// Check for advanced mock utilities
const advancedMockPath = path.join(__dirname, 'utils/advancedSupabaseMock.ts');
if (fs.existsSync(advancedMockPath)) {
  console.log('✓ Advanced mock file exists:', advancedMockPath);
} else {
  console.log('✗ Advanced mock file NOT found:', advancedMockPath);
}

console.log('\n=== Test Dependencies Analysis ===');

// Check if test imports match existing files
const testContent = fs.readFileSync(testPath, 'utf8');
const imports = testContent.match(/import.*from\s+['"]([^'"]+)['"];?/g) || [];

console.log('Test imports:');
imports.forEach(imp => {
  console.log('  ', imp);
});

console.log('\n=== Potential Issues ===');
console.log('1. Test imports advancedSupabaseMock but file may not exist');
console.log('2. Question definitions may have changed (15 vs 13 questions)');
console.log('3. Survey flow may not match test expectations');
console.log('4. Button text selectors may be outdated');
console.log('5. Progress indicators may have changed format');

console.log('\n=== Recommended Fixes ===');
console.log('1. Verify actual question count and order in intakeSurveyQuestions');
console.log('2. Update test expectations to match component reality');
console.log('3. Fix button text selectors (Continue vs Next)');
console.log('4. Update progress indicator expectations');
console.log('5. Create missing mock utilities or fix imports');

// Read question definitions to check actual structure
if (fs.existsSync(surveyQuestionsPath)) {
  const questionContent = fs.readFileSync(surveyQuestionsPath, 'utf8');
  const questionMatch = questionContent.match(/export const intakeSurveyQuestions.*?=\s*\[(.*?)\];/s);

  if (questionMatch) {
    const questionText = questionMatch[1];
    const questionCount = (questionText.match(/\{.*?key:/g) || []).length;
    console.log('\n=== Question Analysis ===');
    console.log('Actual question count in definitions:', questionCount);

    // Extract first question to verify
    const firstQuestionMatch = questionText.match(/\{[^}]*key:[^']*medicalClearance[^}]*\}/);
    if (firstQuestionMatch) {
      console.log('✓ First question is medicalClearance as expected');
    } else {
      console.log('✗ First question structure may have changed');
    }
  }
}

console.log('\n=== Next Steps ===');
console.log('1. Run test with: npm test -- __tests__/components/v2/onboarding/IntakeSurvey.test.tsx');
console.log('2. Capture exact error messages');
console.log('3. Compare test expectations with actual component behavior');
console.log('4. Update selectors and flow to match current implementation');