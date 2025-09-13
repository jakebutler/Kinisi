// Utility for fetching prompt content from PromptLayer registry via REST API
// Caches prompt content in-memory for 10 minutes by default

import 'server-only';
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
  const ac = new AbortController();
  const timeoutMs = Number(process.env.PROMPTLAYER_FETCH_TIMEOUT_MS ?? 3000);
  const t = setTimeout(() => ac.abort(), timeoutMs);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt_name: promptName }),
    signal: ac.signal,
  });
  clearTimeout(t);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch prompt template '${promptName}' from PromptLayer: ${res.status} ${errText}`);
  }

  const data = await res.json();

  // Extract content from the correct location in response structure
  const blocks = Array.isArray(data.prompt_template?.content) ? data.prompt_template.content : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b && b.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => String(b.text ?? ''))
    .join('');

  if (!content) {
    throw new Error(`No content found in prompt template '${promptName}'`);
  }

  PROMPT_CACHE[cacheKey] = { content, expires: now + CACHE_TTL_MS };
  return content;
}

// --- Prompt History Tracking -------------------------------------------------

// Keep types local to avoid leaking SDK types into global scope
type TrackArgs = {
  promptName: string;
  inputVariables: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
};

/**
 * Track a prompt run in PromptLayer's Prompt History without affecting
 * the LLM execution path. This is a safe, best-effort call that no-ops
 * when PromptLayer is not configured or disabled, and never throws.
 */
export async function trackPromptRun({
  promptName,
  inputVariables,
  tags = [],
  metadata = {},
}: TrackArgs): Promise<void> {
  try {
    const { getPromptLayerClient } = await import("./promptlayerClient");
    const pl = getPromptLayerClient();
    if (!pl) return; // Graceful no-op in tests/dev without key

    // Use the PromptLayer SDK's run method to register a run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (pl as any).run({
      promptName,
      inputVariables,
      tags,
      metadata,
    });
  } catch (e) {
    // Non-fatal: do not disrupt generation paths
    // eslint-disable-next-line no-console
    console.warn("[PromptLayer] tracking failed:", e);
  }
}
