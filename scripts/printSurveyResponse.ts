import { getSurveyResponse } from '../utils/surveyResponses';

const userId = '85e10ffa-d857-461e-a4eb-7de15e83862e';

(async () => {
  const { data, error } = await getSurveyResponse(userId);
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log('No survey response found for user:', userId);
    process.exit(0);
  }
  console.log(JSON.stringify(data[0].response, null, 2));
})();
