import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { fetchPromptFromRegistry } from "./promptlayer";
import { retrieveRagChunksForSurvey, formatChunksAsContext } from "./rag";

// Function to generate an assessment using LangChain and OpenAI
// Integrates PromptLayer SDK for tracing and prompt management
export async function generateAssessmentFromSurvey(surveyResponses: Record<string, any>): Promise<string> {
  // Format survey responses as a readable string
  const surveyText = Object.entries(surveyResponses)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  // Retrieve RAG context based on survey responses (graceful fallback on failure)
  let augmentedSurvey = surveyText;
  try {
    const ragChunks = await retrieveRagChunksForSurvey(surveyResponses, 5);
    const ctx = formatChunksAsContext(ragChunks);
    if (ctx) {
      augmentedSurvey = `${surveyText}\n\nCONTEXT:\n${ctx}`;
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
2) Highlights key constraints or risks
3) Recommends focus areas for the next 4–6 weeks
4) Suggests 2–3 actionable next steps

Format as short paragraphs with clear headings. Keep it under 300 words.

SURVEY ANSWERS:\n{{survey}}`;
  }
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
  // Format survey responses as a readable string
  const surveyText = Object.entries(surveyResponses)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  // Fetch revision prompt template from PromptLayer registry (with fallback)
  const REVISION_PROMPT_ID = 80132; // ID for 'Update Personalized Assessment'
  let revisionPromptTemplate: string;
  try {
    revisionPromptTemplate = await fetchPromptFromRegistry(REVISION_PROMPT_ID);
  } catch (e) {
    console.warn("PromptLayer unavailable or misconfigured, using fallback revision prompt.", e);
    revisionPromptTemplate = `You are revising a fitness assessment based on user feedback. Keep the helpful parts, address the feedback, and tighten wording.
Return an updated assessment with clear headings and actionable next steps.

CURRENT ASSESSMENT:\n{{assessment}}\n\nFEEDBACK:\n{{feedback}}\n\nSURVEY ANSWERS:\n{{survey}}`;
  }
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
