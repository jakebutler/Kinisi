// app/api/program/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/authMiddleware";
import { ApiErrors, createErrorResponse, withErrorHandling } from "@/utils/api/errorHandler";
import { ProgramService } from "@/services/programService";

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { user, supabase } = await requireAuth(req);

  const { assessment, exerciseFilter } = await req.json();

  // Validate assessment
  if (!assessment || typeof assessment !== 'string') {
    throw ApiErrors.validation("Assessment is required and must be a string");
  }

  // Validate exerciseFilter
  if (exerciseFilter === undefined || typeof exerciseFilter !== 'object' || exerciseFilter === null) {
    throw ApiErrors.validation("ExerciseFilter is required and must be an object");
  }

  // Generate program using service
  const result = await ProgramService.generateProgram({
    assessment,
    exerciseFilter,
    userId: user.id,
    client: supabase
  });

  return NextResponse.json(result.savedProgram, { status: 201 });
});