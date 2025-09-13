// utils/promptlayerClient.ts
// Lazy PromptLayer client helper with test/dev safeguards

// Avoid static imports from the 'promptlayer' package so Next.js doesn't try to
// bundle optional peer dependencies (@anthropic-ai/sdk, @google/genai, etc.).
// We'll dynamically require the module at runtime on the server only.

type PromptLayerClient = {
  // Minimal surface we use; keep as any to avoid pulling in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<any>;
} | null;

let _pl: PromptLayerClient = null;

/**
 * Returns a singleton PromptLayer client or null when disabled.
 * Disabled when:
 * - NODE_ENV === 'test'
 * - process.env.DISABLE_PROMPTLAYER_TRACKING is truthy
 * - PROMPTLAYER_API_KEY is missing
 */
export function getPromptLayerClient(): PromptLayerClient {
  try {
    if (process.env.NODE_ENV === "test") return null;
    if (String(process.env.DISABLE_PROMPTLAYER_TRACKING || "").toLowerCase() === "true") return null;

    const apiKey = process.env.PROMPTLAYER_API_KEY;
    if (!apiKey) return null;

    if (_pl) return _pl;
    // Use eval('require') to prevent bundlers from resolving 'promptlayer' at build time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req: any = eval('require');
    const { PromptLayer } = req("promptlayer");
    _pl = new PromptLayer({ apiKey });
    return _pl;
  } catch (e) {
    // If the SDK isn't available or any unexpected error occurs, disable tracking gracefully.
    return null;
  }
}
