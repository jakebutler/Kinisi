// utils/llm.ts
import axios from "axios";

/**
 * Calls the LLM via PromptLayer or OpenAI API.
 * @param prompt - The prompt string to send
 * @returns The parsed JSON response from the LLM
 */
export async function callLLMWithPrompt(prompt: string): Promise<any> {
  // Use OpenAI Chat Completions API directly (assessment flow already uses OpenAI successfully)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond ONLY with strict JSON." },
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
