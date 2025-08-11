jest.unmock('@/utils/programDataHelpers');
import { extractExerciseIdsFromProgram } from '@/utils/programDataHelpers';

describe('extractExerciseIdsFromProgram', () => {
  it('should return an empty array if the program has no weeks', () => {
    const program = {};
    const ids = extractExerciseIdsFromProgram(program);
    expect(ids).toEqual([]);
  });

  it('should return an empty array if the program has empty weeks', () => {
    const program = { weeks: [] };
    const ids = extractExerciseIdsFromProgram(program);
    expect(ids).toEqual([]);
  });

  it('should return an array of unique exercise IDs', () => {
    const program = {
      weeks: [
        {
          sessions: [
            {
              exercises: [
                { exercise_id: '1' },
                { exercise_id: '2' },
              ],
            },
            {
              exercises: [
                { exercise_id: '2' },
                { exercise_id: '3' },
              ],
            },
          ],
        },
      ],
    };
    const ids = extractExerciseIdsFromProgram(program);
    expect(ids).toEqual(['1', '2', '3']);
  });

  it('should handle sessions with no exercises', () => {
    const program = {
      weeks: [
        {
          sessions: [
            {
              exercises: [
                { exercise_id: '1' },
                { exercise_id: '2' },
              ],
            },
            {
              exercises: [],
            },
          ],
        },
      ],
    };
    const ids = extractExerciseIdsFromProgram(program);
    expect(ids).toEqual(['1', '2']);
  });

  it('should handle weeks with no sessions', () => {
    const program = {
      weeks: [
        {
          sessions: [],
        },
      ],
    };
    const ids = extractExerciseIdsFromProgram(program);
    expect(ids).toEqual([]);
  });
});
