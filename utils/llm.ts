// utils/llm.ts
import axios from "axios";

/**
 * Calls the LLM via PromptLayer or OpenAI API.
 * @param prompt - The prompt string to send
 * @returns The parsed JSON response from the LLM
 */
export async function callLLMWithPrompt(prompt: string): Promise<any> {
  // Example using PromptLayer's OpenAI proxy
  const apiKey = process.env.PROMPTLAYER_API_KEY;
  if (!apiKey) throw new Error("Missing PROMPTLAYER_API_KEY");

  const response = await axios.post(
    "https://api.promptlayer.com/openai/chat/completions",
    {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1500
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    }
  );

  // Try to parse JSON from the LLM response
  const content = response.data?.choices?.[0]?.message?.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error("LLM output was not valid JSON");
  }
}
