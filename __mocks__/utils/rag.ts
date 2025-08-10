// __mocks__/utils/rag.ts
// Manual mock to avoid real network calls during tests

export const retrieveRagChunksByText = async (_query: string, _k = 5) => {
  return [] as any[];
};

export const retrieveRagChunksForSurvey = async (_survey: Record<string, any>, _k = 5) => {
  return [] as any[];
};

export const formatChunksAsContext = (_chunks: any[]) => "";
