// __tests__/unit/assessmentChain.promptlayer.test.ts
import { jest } from '@jest/globals';

// Mock RAG utilities to avoid embeddings/DB/network
jest.mock('@/utils/rag', () => ({
  retrieveRagChunksForSurvey: jest.fn().mockResolvedValue([]),
  formatChunksAsContext: jest.fn().mockReturnValue(''),
}));

// Mock RunnableSequence.from to prevent any LLM invocation
jest.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: jest.fn(() => ({ invoke: jest.fn().mockResolvedValue('ok') })),
  },
}));

// Ensure OPENAI_API_KEY present to satisfy guards
const OLD_ENV = process.env;

describe('assessmentChain PromptLayer tracking', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, OPENAI_API_KEY: 'test-openai-key' };
    // Clear the global mock installed in jest.setup.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pl = require('@/utils/promptlayer');
    if (pl.trackPromptRun && 'mockClear' in pl.trackPromptRun) {
      pl.trackPromptRun.mockClear();
    }
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('tracks Personalized Assessment generation with expected tags/metadata', async () => {
    const { generateAssessmentFromSurvey } = await import('@/utils/assessmentChain');
    // Call the function under test
    await generateAssessmentFromSurvey({ primaryGoal: 'Strength' }, { userId: 'u1' });
    // Read calls from the global mock installed in jest.setup.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pl = require('@/utils/promptlayer');
    expect(pl.trackPromptRun).toHaveBeenCalledTimes(1);
    const call = pl.trackPromptRun.mock.calls[0][0] as any;
    expect(call.promptName).toBe('Personalized Assessment');
    // Assert survey inputVariables present and non-empty
    expect(typeof call.inputVariables?.survey).toBe('string');
    expect(call.inputVariables.survey.length).toBeGreaterThan(0);
    expect(call.tags).toEqual(expect.arrayContaining(['v2', 'assessment']));
    expect(call.tags).toEqual(expect.arrayContaining(['dev']));
    expect(call.metadata).toMatchObject({
      userId: 'u1',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    });
    expect(call.metadata.usedRegistry).toBe(false);
    expect(call.metadata.ragChunksCount).toBe(0);
  });

  it('tracks Update Personalized Assessment revision with expected tags/metadata', async () => {
    const { reviseAssessmentWithFeedback } = await import('@/utils/assessmentChain');

    await reviseAssessmentWithFeedback({
      currentAssessment: 'A',
      feedback: 'F',
      surveyResponses: {},
      userId: 'u1',
      revisionOfAssessmentId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pl = require('@/utils/promptlayer');
    expect(pl.trackPromptRun).toHaveBeenCalledTimes(1);
    const call = pl.trackPromptRun.mock.calls[0][0] as any;
    expect(call.promptName).toBe('Update Personalized Assessment');
    expect(call.tags).toEqual(expect.arrayContaining(['v2', 'assessment_revision']))
    expect(call.tags).toEqual(expect.arrayContaining(['dev']));
    expect(call.metadata).toMatchObject({
      userId: 'u1',
      revisionOfAssessmentId: '123e4567-e89b-12d3-a456-426614174000',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    });
    expect(call.metadata.usedRegistry).toBe(false);
  });
});
