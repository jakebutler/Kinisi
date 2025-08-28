import { computeCurrentOnboardingStep, isScheduleComplete, isProgramScheduled } from "@/utils/onboarding";

describe("computeCurrentOnboardingStep", () => {
  it("returns 1 when survey not completed", () => {
    expect(computeCurrentOnboardingStep(false, false, false)).toBe(1);
    expect(computeCurrentOnboardingStep(false, true, true)).toBe(1);
  });

  it("returns 2 when survey completed but assessment not approved", () => {
    expect(computeCurrentOnboardingStep(true, false, false)).toBe(2);
    expect(computeCurrentOnboardingStep(true, false, true)).toBe(2);
  });

  it("returns 3 when survey + assessment approved but program not approved", () => {
    expect(computeCurrentOnboardingStep(true, true, false)).toBe(3);
  });

  it("returns 4 when survey + assessment approved and program approved", () => {
    expect(computeCurrentOnboardingStep(true, true, true)).toBe(4);
  });
});

describe("isScheduleComplete (relaxed schedule completion)", () => {
  it("returns false when no program and no lastScheduledAt", () => {
    expect(isScheduleComplete(undefined, null)).toBe(false);
    expect(isScheduleComplete(null, undefined)).toBe(false);
  });

  it("returns false when program has no sessions scheduled and no lastScheduledAt", () => {
    const program = { weeks: [{ sessions: [{ start_at: "" }, { start_at: undefined }] }] } as any;
    expect(isScheduleComplete(program, null)).toBe(false);
  });

  it("returns true when any session has start_at", () => {
    const program = { weeks: [{ sessions: [{ start_at: "2025-01-01T10:00" }, { start_at: "" }] }] } as any;
    expect(isScheduleComplete(program, null)).toBe(true);
  });

  it("returns true when lastScheduledAt is set even if sessions lack start_at", () => {
    const program = { weeks: [{ sessions: [{ start_at: "" }, { start_at: null }] }] } as any;
    expect(isScheduleComplete(program, "2025-01-02T00:00:00Z")).toBe(true);
  });

  it("ignores whitespace lastScheduledAt", () => {
    const program = { weeks: [{ sessions: [] }] } as any;
    expect(isScheduleComplete(program, "   ")).toBe(false);
  });
});

describe("isProgramScheduled vs isScheduleComplete", () => {
  it("isProgramScheduled requires all sessions + startDate; isScheduleComplete is satisfied by any session or lastScheduledAt", () => {
    const program = { weeks: [{ sessions: [
      { start_at: "2025-01-01T10:00" }, // scheduled
      { start_at: "" } // not yet scheduled
    ] }] } as any;
    const startDate = "2025-01-01";

    // Strict: not all sessions have start_at -> false
    expect(isProgramScheduled(program, startDate)).toBe(false);

    // Relaxed: at least one session has start_at -> true
    expect(isScheduleComplete(program, null)).toBe(true);
  });
});
