import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

// Prompt template for generating a personalized assessment from survey responses
// Update this prompt as needed for future changes or LLM providers
const assessmentPrompt = new PromptTemplate({
  inputVariables: ["survey"],
  template: `You are a health and movement coach. Based on the following survey responses, write a personalized assessment that summarizes the user's goals, relevant health information, and provides encouragement. Be concise, friendly, and actionable.\n\nSurvey Responses:\n{survey}\n\nAssessment:`
});

// Function to generate an assessment using LangChain and OpenAI
export async function generateAssessmentFromSurvey(surveyResponses: Record<string, any>): Promise<string> {
  // Format survey responses as a readable string
  const surveyText = Object.entries(surveyResponses)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

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
  const assessment = await chain.invoke({ survey: surveyText });
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

  // Prompt template for revision agent
  const revisionPrompt = new PromptTemplate({
    inputVariables: ["assessment", "feedback", "survey"],
    template: `You are a health and movement coach. Here is a personalized assessment you wrote for a user based on their survey responses. The user has provided feedback or requested changes. Revise the assessment to reflect their feedback, while ensuring it remains coherent, friendly, and actionable.\n\nSurvey Responses:\n{survey}\n\nOriginal Assessment:\n{assessment}\n\nUser Feedback:\n{feedback}\n\nRevised Assessment:`
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
