import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { fetchPromptFromRegistry, trackPromptRun } from "@/utils/promptlayer";
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
export async function generateAssessmentFromSurvey(
  surveyResponses: Record<string, any>,
  opts?: { userId?: string }
): Promise<string> {
  // Format survey responses in a robust, lossless way
  const surveyText = formatSurveyForLLM(surveyResponses);

  // Retrieve RAG context based on survey responses (graceful fallback on failure)
  let augmentedSurvey = surveyText;
  let ragChunksCount = 0;
  try {
    const ragChunks = await retrieveRagChunksForSurvey(surveyResponses, 5);
    ragChunksCount = Array.isArray(ragChunks) ? ragChunks.length : 0;
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
  let usedRegistry = false;
  try {
    promptTemplate = await fetchPromptFromRegistry(ASSESSMENT_PROMPT_ID);
    usedRegistry = true;
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }
  const modelName = "gpt-3.5-turbo" as const; // Change to "gpt-4" or other as needed
  const temperature = 0.7;
  const llm = new ChatOpenAI({
    modelName,
    temperature,
    apiKey,
  });

  // LangChain sequence: prompt -> LLM -> output parser
  const chain = RunnableSequence.from([
    assessmentPrompt,
    llm,
    new StringOutputParser()
  ]);

  // Track the prompt run (fire-and-forget)
  {
    const envTag = process.env.NODE_ENV === "production" ? "prod" : "dev";
    // Intentionally do not await
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    trackPromptRun({
      promptName: "Personalized Assessment",
      inputVariables: { survey: augmentedSurvey },
      tags: [envTag, "assessment", "v2"],
      metadata: {
        userId: opts?.userId,
        usedRegistry,
        ragChunksCount,
        model: modelName,
        temperature,
      },
    });
  }

  // Run the chain with quota error handling
  let assessment: string;
  try {
    assessment = await chain.invoke({ survey: augmentedSurvey });
  } catch (error: any) {
    // Check if it's a quota error
    if (error.message?.includes('InsufficientQuotaError') || error.message?.includes('429')) {
      console.warn("[assessment] OpenAI quota exceeded, using fallback assessment");
      // Generate a basic assessment without LLM
      assessment = generateFallbackAssessment(surveyResponses);
    } else {
      throw error; // Re-throw other errors
    }
  }
  return assessment.trim();
}


// Function to revise an assessment based on user feedback
export async function reviseAssessmentWithFeedback({
  currentAssessment,
  feedback,
  surveyResponses,
  userId,
  revisionOfAssessmentId,
}: {
  currentAssessment: string;
  feedback: string;
  surveyResponses: Record<string, any>;
  userId?: string;
  revisionOfAssessmentId?: string;
}): Promise<string> {
  // Format survey responses robustly
  const surveyText = formatSurveyForLLM(surveyResponses);

  // Fetch revision prompt template from PromptLayer registry (with fallback)
  const REVISION_PROMPT_ID = 80132; // ID for 'Update Personalized Assessment'
  let revisionPromptTemplate: string;
  let usedRegistry = false;
  try {
    revisionPromptTemplate = await fetchPromptFromRegistry(REVISION_PROMPT_ID);
    usedRegistry = true;
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }
  const modelName = "gpt-3.5-turbo" as const;
  const temperature = 0.7;
  const llm = new ChatOpenAI({
    modelName,
    temperature,
    apiKey,
  });

  // LangChain sequence: prompt -> LLM -> output parser
  const chain = RunnableSequence.from([
    revisionPrompt,
    llm,
    new StringOutputParser()
  ]);

  // Track the prompt run (fire-and-forget)
  {
    const envTag = process.env.NODE_ENV === "production" ? "prod" : "dev";
    // Intentionally do not await
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    trackPromptRun({
      promptName: "Update Personalized Assessment",
      inputVariables: { survey: surveyText },
      tags: [envTag, "assessment_revision", "v2"],
      metadata: {
        userId,
        revisionOfAssessmentId,
        usedRegistry,
        model: modelName,
        temperature,
      },
    });
  }

  // Run the chain with quota error handling
  let revised: string;
  try {
    revised = await chain.invoke({
      assessment: currentAssessment,
      feedback,
      survey: surveyText
    });
  } catch (error: any) {
    // Check if it's a quota error
    if (error.message?.includes('InsufficientQuotaError') || error.message?.includes('429')) {
      console.warn("[assessment revision] OpenAI quota exceeded, using fallback revision");
      // Generate a basic revision without LLM
      revised = generateFallbackRevision(currentAssessment, feedback, surveyResponses);
    } else {
      throw error; // Re-throw other errors
    }
  }
  return revised.trim();
}

// Fallback assessment generator for when OpenAI quota is exceeded
function generateFallbackAssessment(survey: Record<string, any>): string {
  const goal = survey.primaryGoal || 'general fitness improvement';
  const frequency = survey.activityFrequency || 'current activity level';
  const physicalFunctionRating = survey.physicalFunction || 'current physical abilities';
  const confidence = survey.confidence || 'moderate confidence';
  const importance = survey.importance || 'moderate importance';

  const hasPain = survey.currentPain?.hasPain;
  const painDescription = hasPain ? survey.currentPain?.description : '';

  const activities = Array.isArray(survey.activityPreferences) ? survey.activityPreferences.join(', ') : 'various activities';
  const equipment = Array.isArray(survey.equipmentAccess) ? survey.equipmentAccess.join(', ') : 'available equipment';

  let assessment = `## Initial Assessment

**Current Status & Goals**
Based on your survey responses, your primary goal is ${goal}. You're currently active ${frequency.toLowerCase()} and rate your physical function as ${physicalFunctionRating.toLowerCase()}. Your confidence level is ${confidence}/10 and you rate this goal as ${importance}/10 in importance.

`;

  if (hasPain && painDescription) {
    assessment += `**Health Considerations**
You reported current pain or injury: ${painDescription}. This will be taken into account in your program design.

`;
  }

  assessment += `**Focus Areas for Next 4-6 Weeks**
1. **Progressive Overload**: Gradually increase intensity while maintaining proper form
2. **Consistency**: Establish a sustainable routine that works with your schedule
3. **Movement Quality**: Focus on proper technique before increasing intensity

**Recommended Next Steps**
1. Begin with 2-3 sessions per week focusing on fundamental movement patterns
2. Gradually progress to ${survey.timeCommitment?.daysPerWeek || 3-4} days per week as tolerated
3. Include activities you enjoy: ${activities}
4. Utilize available equipment: ${equipment}

**Timeline Expectations**
With consistent effort, you should start noticing improvements in energy levels and movement quality within 2-3 weeks, with more significant changes in 6-8 weeks.

*This assessment was generated based on your survey responses. For a more personalized assessment, you may want to consult with a qualified fitness professional.*`;

  return assessment;
}

// Fallback revision generator for when OpenAI quota is exceeded
function generateFallbackRevision(currentAssessment: string, feedback: string, survey: Record<string, any>): string {
  const timestamp = new Date().toLocaleDateString();

  let revision = `## Updated Assessment (${timestamp})

**Previous Assessment Summary**
${currentAssessment.split('\n').slice(0, 10).join('\n')}...

**Revisions Based on Your Feedback**
Thank you for the feedback: "${feedback}". I've updated your assessment to better address your needs.

**Updated Focus Areas**
1. **Address Your Feedback**: Incorporating your specific concerns and preferences
2. **Personalized Approach**: Tailoring the program more specifically to your situation
3. **Practical Implementation**: Ensuring recommendations are actionable for your lifestyle

**Refined Recommendations**
- Continue with the foundational approach from the original assessment
- Adjust exercises and intensity based on your feedback
- Focus more on ${survey.activityPreferences?.join(', ') || 'activities you enjoy'}
- Work within your time constraints: ${survey.timeCommitment?.minutesPerSession || '30-45'} minutes per session

**Next Steps**
1. Start with the revised approach at a comfortable intensity
2. Monitor your response and adjust as needed
3. Provide additional feedback as you progress

*This revision was generated based on your feedback. For optimal results, consider working with a qualified fitness professional who can provide ongoing personalized guidance.*`;

  return revision;
}
