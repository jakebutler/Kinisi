// Utility for fetching prompt content from PromptLayer registry via REST API
// Caches prompt content in-memory for 10 minutes by default

const PROMPT_CACHE: Record<string, { content: string; expires: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Fetches a PromptLayer Prompt Template by numeric ID
// Map of prompt IDs to their names (update this with your actual templates)
const PROMPT_ID_TO_NAME: Record<number, string> = {
  80132: "Update Personalized Assessment",
  80123: "Personalized Assessment",
  74916: "Example: page_title"
};

// Fetches a PromptLayer Prompt Template by numeric ID
export async function fetchPromptFromRegistry(promptId: number): Promise<string> {
  const cacheKey = String(promptId);
  const now = Date.now();
  if (PROMPT_CACHE[cacheKey] && PROMPT_CACHE[cacheKey].expires > now) {
    return PROMPT_CACHE[cacheKey].content;
  }

  const apiKey = process.env.PROMPTLAYER_API_KEY;
  if (!apiKey) {
    throw new Error('PROMPTLAYER_API_KEY environment variable is not set');
  }

  const promptName = PROMPT_ID_TO_NAME[promptId];
  if (!promptName) {
    throw new Error(`Unknown prompt ID '${promptId}'. Available IDs: ${Object.keys(PROMPT_ID_TO_NAME).join(', ')}`);
  }

  // Use the correct REST API endpoint with prompt_name
  const url = "https://api.promptlayer.com/rest/get-prompt-template";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt_name: promptName })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch prompt template '${promptName}' from PromptLayer: ${res.status} ${errText}`);
  }

  const data = await res.json();

  // Extract content from the correct location in response structure
  const content = data.prompt_template?.messages?.[0]?.prompt?.template || "";

  if (!content) {
    throw new Error(`No content found in prompt template '${promptName}'`);
  }

  PROMPT_CACHE[cacheKey] = { content, expires: now + CACHE_TTL_MS };
  return content;
}

