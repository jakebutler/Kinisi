// utils/promptlayerClient.ts
// Lazy PromptLayer client helper with test/dev safeguards

import type { PromptLayer as PromptLayerType } from "promptlayer";

let _pl: PromptLayerType | null = null;

/**
 * Returns a singleton PromptLayer client or null when disabled.
 * Disabled when:
 * - NODE_ENV === 'test'
 * - process.env.DISABLE_PROMPTLAYER_TRACKING is truthy
 * - PROMPTLAYER_API_KEY is missing
 */
export function getPromptLayerClient(): PromptLayerType | null {
  try {
    if (process.env.NODE_ENV === "test") return null;
    if (String(process.env.DISABLE_PROMPTLAYER_TRACKING || "").toLowerCase() === "true") return null;

    const apiKey = process.env.PROMPTLAYER_API_KEY;
    if (!apiKey) return null;

    if (_pl) return _pl;
    // Note: direct import is fine in server context; this file should not be bundled into client code paths.
    // If needed, convert to dynamic import to avoid ESM/CJS interop concerns.
    const { PromptLayer } = require("promptlayer") as { PromptLayer: new (args: { apiKey: string }) => PromptLayerType };
    _pl = new PromptLayer({ apiKey });
    return _pl;
  } catch (e) {
    // If the SDK isn't available or any unexpected error occurs, disable tracking gracefully.
    return null;
  }
}
