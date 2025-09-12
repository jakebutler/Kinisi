import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { fetchPromptFromRegistry } from "./promptlayer";
import { retrieveRagChunksForSurvey, formatChunksAsContext } from "./rag";

// Helper: Format survey responses into a concise, human-readable block for the LLM
function formatSurveyForLLM(survey: Record<string, any>): string {
  if (!survey || typeof survey !== 'object') return '';

  const lines: string[] = [];

  const push = (label: string, value: string | number | boolean | string[] | undefined | null) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) lines.push(`${label}: ${value.join(', ')}`);
    } else {
      lines.push(`${label}: ${value}`);
    }
  };

  // Primary info
  push('Primary Goal', survey.primaryGoal);
  push('Medical Clearance (ever told not to exercise)', survey.medicalClearance);

  // Pain - only include if hasPain === true
  if (survey.currentPain && typeof survey.currentPain === 'object') {
    const { hasPain, description } = survey.currentPain as { hasPain?: boolean; description?: string };
    if (hasPain) {
      push('Current Pain/Injury', description || 'Yes');
    }
  }

  // Activity & function
  push('Activity Frequency (days/week 30+ min)', survey.activityFrequency);
  push('Physical Function (self-rated)', survey.physicalFunction);
  push('Intention to Increase Activity (30 days)', survey.intentToChange);
  if (typeof survey.importance === 'number') push('Importance (0–10)', survey.importance);
  if (typeof survey.confidence === 'number') push('Confidence (0–10)', survey.confidence);
  push('Sleep (hours)', survey.sleep);
  push('Tobacco Use', survey.tobaccoUse);

  // Preferences and equipment
  const activities: string[] = Array.isArray(survey.activityPreferences) ? survey.activityPreferences : [];
  const otherAct = typeof survey.otherActivityPreferences === 'string' && survey.otherActivityPreferences.trim() ? `Other: ${survey.otherActivityPreferences.trim()}` : '';
  if (otherAct) activities.push(otherAct);
  if (activities.length) push('Activity Preferences', activities);

  const equipment: string[] = Array.isArray(survey.equipmentAccess) ? survey.equipmentAccess : [];
  const otherEq = typeof survey.otherEquipmentAccess === 'string' && survey.otherEquipmentAccess.trim() ? `Other: ${survey.otherEquipmentAccess.trim()}` : '';
  if (otherEq) equipment.push(otherEq);
  if (equipment.length) push('Equipment Access', equipment);

  // Time commitment
  if (survey.timeCommitment && typeof survey.timeCommitment === 'object') {
    const { daysPerWeek, minutesPerSession, preferredTimeOfDay } = survey.timeCommitment as { daysPerWeek?: number | null; minutesPerSession?: string; preferredTimeOfDay?: string };
    if (typeof daysPerWeek === 'number') push('Days per Week', daysPerWeek);
    if (minutesPerSession && String(minutesPerSession).trim()) push('Minutes per Session', String(minutesPerSession).trim());
    push('Preferred Time of Day', preferredTimeOfDay);
  }

  // Fallback for any remaining top-level keys not captured above
  for (const [key, val] of Object.entries(survey)) {
    if ([
      'primaryGoal','medicalClearance','currentPain','activityFrequency','physicalFunction','intentToChange','importance','confidence','sleep','tobaccoUse','activityPreferences','otherActivityPreferences','equipmentAccess','otherEquipmentAccess','timeCommitment'
    ].includes(key)) continue;
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'object') {
      try {
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } catch {
        // skip non-serializable
      }
    } else {
      lines.push(`${key}: ${val}`);
    }
  }

  return lines.join("\n");
}

// Function to generate an assessment using LangChain and OpenAI
// Integrates PromptLayer SDK for tracing and prompt management
export async function generateAssessmentFromSurvey(surveyResponses: Record<string, any>): Promise<string> {
  // Format survey responses in a robust, lossless way
  const surveyText = formatSurveyForLLM(surveyResponses);

  // Retrieve RAG context based on survey responses (graceful fallback on failure)
  let augmentedSurvey = surveyText;
  try {
    const ragChunks = await retrieveRagChunksForSurvey(surveyResponses, 5);
    const ctx = formatChunksAsContext(ragChunks);
    if (ctx) {
      augmentedSurvey = `${surveyText}\n\nCONTEXT (optional, use only if relevant):\n${ctx}`;
    }
  } catch (e) {
    console.warn("RAG retrieval failed, continuing without context", e);
  }

  // Fetch prompt template from PromptLayer registry with fallback
  const ASSESSMENT_PROMPT_ID = 80123; // ID for 'Personalized Assessment'
  let promptTemplate: string;
  try {
    promptTemplate = await fetchPromptFromRegistry(ASSESSMENT_PROMPT_ID);
  } catch (e) {
    console.warn("PromptLayer unavailable or misconfigured, using fallback prompt.", e);
    promptTemplate = `You are an experienced fitness coach creating a personalized initial assessment.
Input is a set of survey answers about the user's goals, history, and constraints.
Write a concise, empathetic assessment that:
1) Summarizes current status and goals
2) Highlights key constraints or risks (only if present in SURVEY ANSWERS)
3) Recommends focus areas for the next 4–6 weeks
4) Suggests 2–3 actionable next steps

Strict rules:
- Use ONLY facts provided in SURVEY ANSWERS. Do NOT invent symptoms or conditions.
- If pain is not present in SURVEY ANSWERS, do not mention pain.
- Use CONTEXT only when it directly supports SURVEY ANSWERS.

Format as short paragraphs with clear headings. Keep it under 300 words.

SURVEY ANSWERS:\n{{survey}}`;
  }
  const ASSESSMENT_GUARDRAILS = `\n\nAdditional strict rules:\n- Do NOT instruct the user to take a separate physical fitness test. Base your assessment solely on SURVEY ANSWERS.\n- Do NOT introduce symptoms, injuries, or constraints that are not present in SURVEY ANSWERS.`;
  promptTemplate = `${promptTemplate}${ASSESSMENT_GUARDRAILS}`;
  const assessmentPrompt = new PromptTemplate({
    inputVariables: ["survey"],
    template: promptTemplate
  });

  // Use OpenAI's gpt-3.5-turbo by default; ensure API key present
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // Change to "gpt-4" or other as needed
    temperature: 0.7,
    apiKey,
  });

  // LangChain sequence: prompt -> LLM -> output parser
  const chain = RunnableSequence.from([
    assessmentPrompt,
    llm,
    new StringOutputParser()
  ]);

  // Run the chain
  const assessment = await chain.invoke({ survey: augmentedSurvey });
  return assessment.trim();
}


// Function to revise an assessment based on user feedback
export async function reviseAssessmentWithFeedback({
  currentAssessment,
  feedback,
  surveyResponses
}: {
  currentAssessment: string;
  feedback: string;
  surveyResponses: Record<string, any>;
}): Promise<string> {
  // Format survey responses robustly
  const surveyText = formatSurveyForLLM(surveyResponses);

  // Fetch revision prompt template from PromptLayer registry (with fallback)
  const REVISION_PROMPT_ID = 80132; // ID for 'Update Personalized Assessment'
  let revisionPromptTemplate: string;
  try {
    revisionPromptTemplate = await fetchPromptFromRegistry(REVISION_PROMPT_ID);
  } catch (e) {
    console.warn("PromptLayer unavailable or misconfigured, using fallback revision prompt.", e);
    revisionPromptTemplate = `You are revising a fitness assessment based on user feedback. Keep helpful parts, address the feedback, and tighten wording.
Return an updated assessment with clear headings and actionable next steps.

Strict rules:
- Use ONLY facts provided in SURVEY ANSWERS. Do NOT invent symptoms or conditions.
- If pain is not present in SURVEY ANSWERS, do not mention pain.
- Keep revisions consistent with the user's constraints and preferences.

CURRENT ASSESSMENT:\n{{assessment}}\n\nFEEDBACK:\n{{feedback}}\n\nSURVEY ANSWERS:\n{{survey}}`;
  }
  const REVISION_GUARDRAILS = `\n\nAdditional strict rules:\n- Do NOT direct the user to perform an external physical fitness test; revise based on SURVEY ANSWERS and FEEDBACK only.\n- Do NOT invent conditions or constraints not present in SURVEY ANSWERS.`;
  revisionPromptTemplate = `${revisionPromptTemplate}${REVISION_GUARDRAILS}`;
  const revisionPrompt = new PromptTemplate({
    inputVariables: ["assessment", "feedback", "survey"],
    template: revisionPromptTemplate
  });

  // Use OpenAI's gpt-3.5-turbo by default (ensure API key)
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    apiKey,
  });

  // LangChain sequence: prompt -> LLM -> output parser
  const chain = RunnableSequence.from([
    revisionPrompt,
    llm,
    new StringOutputParser()
  ]);

  // Run the chain
  const revised = await chain.invoke({
    assessment: currentAssessment,
    feedback,
    survey: surveyText
  });
  return revised.trim();
}
