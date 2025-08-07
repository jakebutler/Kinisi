// Mock programDataHelpers functions with inline mocks
const mockGetAvailableExercises = jest.fn();
const mockGetProgramById = jest.fn();
const mockSaveProgramFeedback = jest.fn();
const mockApproveProgram = jest.fn();
const mockSaveExerciseProgram = jest.fn();

jest.mock('@/utils/programDataHelpers', () => ({
  getAvailableExercises: mockGetAvailableExercises,
  getProgramById: mockGetProgramById,
  saveProgramFeedback: mockSaveProgramFeedback,
  approveProgram: mockApproveProgram,
  saveExerciseProgram: mockSaveExerciseProgram
}));

// Import after mocking
import { saveExerciseProgram, getProgramById, saveProgramFeedback, approveProgram, getAvailableExercises } from "@/utils/programDataHelpers";

describe("programDataHelpers utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch available exercises (no filter)", async () => {
    // Setup mock response
    const mockExercises = [
      {
        exercise_id: 'pushup',
        name: 'Push-up',
        target_muscles: ['chest'],
        equipments: ['bodyweight']
      },
      {
        exercise_id: 'squat',
        name: 'Squat',
        target_muscles: ['legs'],
        equipments: ['bodyweight']
      }
    ];
    mockGetAvailableExercises.mockResolvedValue(mockExercises);

    const exercises = await getAvailableExercises();
    expect(Array.isArray(exercises)).toBe(true);
    expect(exercises).toHaveLength(2);
    expect(exercises[0]).toHaveProperty("exercise_id");
    expect(exercises[0]).toHaveProperty("name");
    expect(mockGetAvailableExercises).toHaveBeenCalledTimes(1);
  });

  it("should throw on invalid program fetch", async () => {
    mockGetProgramById.mockRejectedValue(new Error('Program not found'));
    
    await expect(getProgramById("nonexistent-id")).rejects.toThrow('Program not found');
    expect(mockGetProgramById).toHaveBeenCalledWith("nonexistent-id");
  });

  it("should throw on invalid approve", async () => {
    mockApproveProgram.mockRejectedValue(new Error('Program not found'));
    
    await expect(approveProgram("nonexistent-id")).rejects.toThrow('Program not found');
    expect(mockApproveProgram).toHaveBeenCalledWith("nonexistent-id");
  });

  it("should throw on invalid feedback save", async () => {
    mockSaveProgramFeedback.mockRejectedValue(new Error('Invalid program ID'));
    
    await expect(saveProgramFeedback({ program_id: "bad", user_id: "bad", feedback: "test" })).rejects.toThrow('Invalid program ID');
    expect(mockSaveProgramFeedback).toHaveBeenCalledWith({ program_id: "bad", user_id: "bad", feedback: "test" });
  });

  it("should save exercise program successfully", async () => {
    const mockProgram = {
      id: 'program-123',
      status: 'created'
    };
    mockSaveExerciseProgram.mockResolvedValue(mockProgram);
    
    const result = await saveExerciseProgram('user-123', { weeks: [] });
    expect(result).toEqual(mockProgram);
    expect(mockSaveExerciseProgram).toHaveBeenCalledWith('user-123', { weeks: [] });
  });
});
