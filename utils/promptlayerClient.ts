// utils/promptlayerClient.ts
// Lazy PromptLayer client helper with test/dev safeguards

import 'server-only';

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
 * - DISABLE_PROMPTLAYER_TRACKING is set to a truthy value ('true'|'1'|'yes'|'on', case-insensitive)
 * - PROMPTLAYER_API_KEY is missing
 */
export function getPromptLayerClient(): PromptLayerClient {
  try {
    if (process.env.NODE_ENV === "test") {
      // eslint-disable-next-line no-console
      console.debug('[PromptLayer] disabled: test environment');
      return null;
    }
    const disable = String(process.env.DISABLE_PROMPTLAYER_TRACKING || "").toLowerCase();
    if (["true","1","yes","on"].includes(disable)) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[PromptLayer] disabled via DISABLE_PROMPTLAYER_TRACKING');
      }
      return null;
    }

    const apiKey = process.env.PROMPTLAYER_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[PromptLayer] disabled: PROMPTLAYER_API_KEY missing');
      }
      return null;
    }

    if (_pl) return _pl;
    // Use eval('require') to prevent bundlers from resolving 'promptlayer' at build time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req: any = eval('require');
    const mod = req("promptlayer");
    const PromptLayerCtor = (mod as any).PromptLayer ?? (mod as any).default;
    _pl = new PromptLayerCtor({ apiKey });
    return _pl;
  } catch (e) {
    // If the SDK isn't available or any unexpected error occurs, disable tracking gracefully.
    return null;
  }
}
