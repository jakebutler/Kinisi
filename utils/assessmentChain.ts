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

  // Fetch prompt template from PromptLayer registry
  const ASSESSMENT_PROMPT_ID = 80123; // ID for 'Personalized Assessment'
  const promptTemplate = await fetchPromptFromRegistry(ASSESSMENT_PROMPT_ID);
  const assessmentPrompt = new PromptTemplate({
    inputVariables: ["survey"],
    template: promptTemplate
  });

  // Use OpenAI's gpt-3.5-turbo by default; update here to change model/provider
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // Change to "gpt-4" or other as needed
    temperature: 0.7,
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

  // Fetch revision prompt template from PromptLayer registry
  const REVISION_PROMPT_ID = 80132; // ID for 'Update Personalized Assessment'
  const revisionPromptTemplate = await fetchPromptFromRegistry(REVISION_PROMPT_ID);
  const revisionPrompt = new PromptTemplate({
    inputVariables: ["assessment", "feedback", "survey"],
    template: revisionPromptTemplate
  });

  // Use OpenAI's gpt-3.5-turbo by default
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
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
