// app/api/program/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/authMiddleware";
import { ApiErrors, createErrorResponse, withErrorHandling } from "@/utils/api/errorHandler";
import { ProgramService } from "@/services/programService";

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { user, supabase } = await requireAuth(req);

  const { assessmentId, exerciseFilter } = await req.json();

  if (!assessmentId || typeof assessmentId !== 'string') {
    throw ApiErrors.validation("assessmentId is required and must be a string");
  }

  if (exerciseFilter === undefined || typeof exerciseFilter !== 'object' || exerciseFilter === null) {
    throw ApiErrors.validation("exerciseFilter is required and must be an object");
  }

  // Fetch assessment from database
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('assessments')
    .select('assessment')
    .eq('id', assessmentId)
    .single();

  if (assessmentError) {
    throw ApiErrors.serverError("Failed to fetch assessment");
  }

  const assessment = assessmentData.assessment;

  // Generate program using service
  const result = await ProgramService.generateProgram({
    assessment,
    exerciseFilter,
    userId: user.id,
    client: supabase
  });

  return NextResponse.json(result.savedProgram, { status: 201 });
});
